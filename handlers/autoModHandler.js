// ============================================================
//  INET BOT — Auto-Mod Handler
//  Handles: toxic words, mass mentions, MrBeast/scam detection
//  All violations → delete message + 5min timeout + log
// ============================================================

const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config');
const { autoModEmbed } = require('../utils/embedBuilder');

const db = require('../utils/database');

// ─────────────────────────────────────────────────────────────
//  Emoji Spam Tracker  (in-memory, resets on restart)
//  Map: userId => { count, lastReset, warnings }
// ─────────────────────────────────────────────────────────────
const emojiTracker = new Map();
const EMOJI_WINDOW_MS   = 10_000;  // 10-second rolling window
const EMOJI_LIMIT       = 5;       // emojis per window before warn
const EMOJI_WARN_LIMIT  = 3;       // warnings before timeout

// ─────────────────────────────────────────────────────────────
//  Mention Spam Tracker  (in-memory, resets on restart)
//  Map: `senderId:targetId` => { count, lastReset }
//  If sender pings the same person >2 times in 30s => timeout
// ─────────────────────────────────────────────────────────────
const mentionTracker = new Map();
const MENTION_WINDOW_MS = 30_000; // 30-second rolling window
const MENTION_LIMIT     = 2;      // max times same user can be pinged

// ─────────────────────────────────────────────────────────────
//  Timeout helper — applies timeout + saves roles + adds blacklist
// ─────────────────────────────────────────────────────────────
async function applyTimeout(member, durationMs, reason) {
    try {
        if (!member.moderatable) return false;
        
        // 1. Apply Discord Timeout
        await member.timeout(durationMs, reason);

        // 2. Blacklist Role Logic
        const blacklistRoleId = '1531296667742244995';
        const guild = member.guild;
        const me = guild.members.me;
        
        const savedRoles = [];
        const rolesToRemove = [];
        
        member.roles.cache.forEach(role => {
            if (role.id !== guild.id && !role.managed && me.roles.highest.position > role.position) {
                savedRoles.push(role.id);
                rolesToRemove.push(role);
            }
        });

        const expiresAt = new Date(Date.now() + durationMs);
        
        await db.saveMemberTimeout({
            userId: member.id,
            guildId: guild.id,
            roles: JSON.stringify(savedRoles),
            expiresAt: expiresAt,
        });

        if (rolesToRemove.length > 0) {
            await member.roles.remove(rolesToRemove, 'Auto-Mod Timeout').catch(() => {});
        }
        
        const blacklistRole = guild.roles.cache.get(blacklistRoleId);
        if (blacklistRole) {
            await member.roles.add(blacklistRole, 'Auto-Mod Timeout (Blacklisted)').catch(() => {});
        }

        return true;
    } catch (err) {
        console.error('[AutoMod Timeout Error]', err);
        return false;
    }
}

// ─────────────────────────────────────────────────────────────
//  Send log to auto-mod log channel (or text log as fallback)
// ─────────────────────────────────────────────────────────────
async function sendAutoModLog(guild, embed) {
    const channelId = config.AUTOMOD.LOG_CHANNEL || config.CHANNELS.TEXT_LOG;
    if (!channelId || channelId.includes('_HERE')) return;
    try {
        const ch = guild.channels.cache.get(channelId);
        if (ch) await ch.send({ embeds: [embed] });
    } catch { /* ignore */ }
}

// ─────────────────────────────────────────────────────────────
//  Warn the user in DMs
// ─────────────────────────────────────────────────────────────
async function warnUser(member, reason) {
    try {
        await member.user.send({
            content: `> **[${member.guild.name}] Auto-Mod Warning**\n> ${reason}\n> You have been timed out for **5 minutes**.`
        });
    } catch { /* DMs may be closed */ }
}

// ─────────────────────────────────────────────────────────────
//  TOXIC WORD CHECK
// ─────────────────────────────────────────────────────────────
async function checkToxicWords(message) {
    if (!config.AUTOMOD.ENABLED) return false;
    if (!config.AUTOMOD.TOXIC_WORDS.length) return false;

    const content = message.content.toLowerCase();
    const found = config.AUTOMOD.TOXIC_WORDS.some(word => content.includes(word.toLowerCase()));

    if (!found) return false;

    // Delete
    try { await message.delete(); } catch { /* already deleted */ }

    // Timeout
    const timedOut = await applyTimeout(
        message.member,
        config.AUTOMOD.TIMEOUT_DURATION_MS,
        'Auto-Mod: Toxic language detected'
    );

    // Warn user
    await warnUser(message.member, 'Toxic / banned word detected in your message.');

    // Log
    const embed = autoModEmbed({
        type: 'Toxic Word',
        member: message.member,
        reason: 'Banned word detected in message',
        action: timedOut ? `Timed out for ${config.AUTOMOD.TIMEOUT_DURATION_MS / 60000} minutes` : 'Message deleted (timeout failed)',
    });
    await sendAutoModLog(message.guild, embed);

    return true;
}

// ─────────────────────────────────────────────────────────────
//  MASS MENTION CHECK
// ─────────────────────────────────────────────────────────────
async function checkMassMention(message) {
    if (!config.AUTOMOD.ENABLED) return false;

    const totalMentions =
        message.mentions.users.size +
        message.mentions.roles.size +
        (message.mentions.everyone ? 1 : 0);

    if (totalMentions < config.AUTOMOD.MASS_MENTION_THRESHOLD) return false;

    // Delete
    try { await message.delete(); } catch { /* already deleted */ }

    // Timeout
    const timedOut = await applyTimeout(
        message.member,
        config.AUTOMOD.TIMEOUT_DURATION_MS,
        'Auto-Mod: Mass mention spam'
    );

    // Warn user
    await warnUser(message.member, `Mass mention spam detected (${totalMentions} mentions).`);

    // Log
    const embed = autoModEmbed({
        type: 'Mass Mention',
        member: message.member,
        reason: `Sent ${totalMentions} mention(s) in a single message`,
        action: timedOut ? `Timed out for ${config.AUTOMOD.TIMEOUT_DURATION_MS / 60000} minutes` : 'Message deleted (timeout failed)',
    });
    await sendAutoModLog(message.guild, embed);

    return true;
}

// ─────────────────────────────────────────────────────────────
//  SCAM / IMAGE SCAM CHECK
//  Checks message text + attachment filenames + image URLs
// ─────────────────────────────────────────────────────────────
async function checkScam(message) {
    if (!config.AUTOMOD.ENABLED) return false;
    if (!config.AUTOMOD.SCAM_KEYWORDS.length) return false;

    const content = message.content.toLowerCase();

    // Build full text to scan (message + attachment names + urls)
    const attachmentText = [...message.attachments.values()]
        .map(a => `${a.name} ${a.url}`)
        .join(' ')
        .toLowerCase();

    const embedText = message.embeds
        .map(e => `${e.title || ''} ${e.description || ''} ${e.url || ''}`)
        .join(' ')
        .toLowerCase();

    const fullText = `${content} ${attachmentText} ${embedText}`;
    const found = config.AUTOMOD.SCAM_KEYWORDS.some(kw => fullText.includes(kw.toLowerCase()));

    if (!found) return false;

    // Delete
    try { await message.delete(); } catch { /* already deleted */ }

    // Timeout
    const timedOut = await applyTimeout(
        message.member,
        config.AUTOMOD.TIMEOUT_DURATION_MS,
        'Auto-Mod: Scam / phishing content detected'
    );

    // Warn user
    await warnUser(message.member, 'Scam or phishing content detected in your message.');

    // Log
    const embed = autoModEmbed({
        type: 'Scam / Image Scam',
        member: message.member,
        reason: 'Scam/phishing keyword matched in message or attachment',
        action: timedOut ? `Timed out for ${config.AUTOMOD.TIMEOUT_DURATION_MS / 60000} minutes` : 'Message deleted (timeout failed)',
    });
    await sendAutoModLog(message.guild, embed);

    return true;
}

// ─────────────────────────────────────────────────────────────
//  ANTI-LINK CHECK (For Restricted Channels)
// ─────────────────────────────────────────────────────────────
async function checkLinks(message) {
    if (!config.AUTOMOD.ENABLED) return false;
    if (!config.AUTOMOD.ANTI_LINK || !config.AUTOMOD.ANTI_LINK.ENABLED) return false;

    // Check if channel is restricted
    if (!config.AUTOMOD.ANTI_LINK.RESTRICTED_CHANNELS.includes(message.channel.id)) return false;

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    if (!urlRegex.test(message.content)) return false;

    // Delete
    try { await message.delete(); } catch { /* already deleted */ }

    // Timeout (5 mins)
    const timedOut = await applyTimeout(
        message.member,
        5 * 60 * 1000,
        'Auto-Mod: Posting links in restricted channel'
    );

    // Warn user
    await warnUser(message.member, 'Posting links is not allowed in this channel. You have been timed out for 5 minutes.');

    // Log
    const embed = autoModEmbed({
        type: 'Anti-Link',
        member: message.member,
        reason: 'Posted a link in a restricted channel',
        action: timedOut ? `Timed out for 5 minutes` : 'Message deleted (timeout failed)',
    });
    await sendAutoModLog(message.guild, embed);

    return true;
}

// ─────────────────────────────────────────────────────────────
//  EMOJI SPAM CHECK
//  Counts Unicode emojis + custom Discord emojis per user.
//  >5 in 10s → warn in channel. 3 warns → timeout 5 min.
// ─────────────────────────────────────────────────────────────
async function checkEmojiSpam(message) {
    if (!config.AUTOMOD.ENABLED) return false;

    // Count all emojis: unicode + custom Discord <:name:id> / <a:name:id>
    const unicodeEmojiRegex = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu;
    const customEmojiRegex  = /<a?:[a-zA-Z0-9_]+:\d+>/g;
    const unicodeMatches = message.content.match(unicodeEmojiRegex) || [];
    const customMatches  = message.content.match(customEmojiRegex)  || [];
    const emojiCount = unicodeMatches.length + customMatches.length;

    if (emojiCount === 0) return false;

    const userId = message.author.id;
    const now    = Date.now();

    // Get or create tracker entry
    let entry = emojiTracker.get(userId);
    if (!entry || now - entry.lastReset > EMOJI_WINDOW_MS) {
        entry = { count: 0, lastReset: now, warnings: entry ? entry.warnings : 0 };
    }

    entry.count += emojiCount;
    emojiTracker.set(userId, entry);

    // Below threshold — no action
    if (entry.count <= EMOJI_LIMIT) return false;

    // Reset window count so we don't spam-warn on every message
    entry.count = 0;
    entry.warnings += 1;
    emojiTracker.set(userId, entry);

    // Still has warnings remaining → send in-channel warning
    if (entry.warnings < EMOJI_WARN_LIMIT) {
        try { await message.delete(); } catch { /* already gone */ }

        await message.channel.send({
            content: `⚠️ ${message.author} **Stop spamming emojis!** (Warning ${entry.warnings}/${EMOJI_WARN_LIMIT}) — Next violation will result in a timeout.`,
        }).then(m => setTimeout(() => m.delete().catch(() => {}), 8000));

        return true;
    }

    // Hit warn limit → timeout
    try { await message.delete(); } catch { /* already gone */ }

    // Reset warnings after timeout so they start fresh
    entry.warnings = 0;
    emojiTracker.set(userId, entry);

    const timedOut = await applyTimeout(
        message.member,
        config.AUTOMOD.TIMEOUT_DURATION_MS,
        'Auto-Mod: Emoji spam'
    );

    await message.channel.send({
        content: `🚫 ${message.author} has been timed out for **emoji spam**.`,
    }).then(m => setTimeout(() => m.delete().catch(() => {}), 10000));

    await warnUser(message.member, 'You were timed out for spamming emojis repeatedly.');

    const embed = autoModEmbed({
        type: 'Emoji Spam',
        member: message.member,
        reason: `Sent excessive emojis (${EMOJI_WARN_LIMIT} warnings triggered)`,
        action: timedOut ? `Timed out for ${config.AUTOMOD.TIMEOUT_DURATION_MS / 60000} minutes` : 'Message deleted (timeout failed)',
    });
    await sendAutoModLog(message.guild, embed);

    return true;
}

// ─────────────────────────────────────────────────────────────
//  MENTION SPAM CHECK
//  If sender pings the same user more than 2 times in 30s → timeout
// ─────────────────────────────────────────────────────────────
async function checkMentionSpam(message) {
    if (!config.AUTOMOD.ENABLED) return false;
    if (message.mentions.users.size === 0) return false;

    const senderId = message.author.id;
    const now      = Date.now();
    let triggered  = false;

    for (const [targetId] of message.mentions.users) {
        // Don't track self-mentions
        if (targetId === senderId) continue;

        const key   = `${senderId}:${targetId}`;
        let entry   = mentionTracker.get(key);

        // Reset window if expired
        if (!entry || now - entry.lastReset > MENTION_WINDOW_MS) {
            entry = { count: 0, lastReset: now };
        }

        entry.count += 1;
        mentionTracker.set(key, entry);

        if (entry.count > MENTION_LIMIT) {
            triggered = true;
            // Reset so they get a fresh window after punishment
            mentionTracker.set(key, { count: 0, lastReset: now });
            break;
        }
    }

    if (!triggered) return false;

    // Delete the offending message
    try { await message.delete(); } catch { /* already gone */ }

    // Apply timeout immediately (no warning phase — this is direct harassment)
    const timedOut = await applyTimeout(
        message.member,
        config.AUTOMOD.TIMEOUT_DURATION_MS,
        'Auto-Mod: Mention spam (pinging same user repeatedly)'
    );

    await message.channel.send({
        content: `🚫 ${message.author} has been timed out for **repeatedly mentioning the same user**.`,
    }).then(m => setTimeout(() => m.delete().catch(() => {}), 10000));

    await warnUser(message.member, 'You were timed out for repeatedly pinging the same person. This is considered harassment.');

    const embed = autoModEmbed({
        type: 'Mention Spam',
        member: message.member,
        reason: `Pinged the same user more than ${MENTION_LIMIT} times within 30 seconds`,
        action: timedOut ? `Timed out for ${config.AUTOMOD.TIMEOUT_DURATION_MS / 60000} minutes` : 'Message deleted (timeout failed)',
    });
    await sendAutoModLog(message.guild, embed);

    return true;
}

async function runAutoMod(message) {
    if (message.author.bot) return;
    if (!message.guild)     return;
    if (!message.member)    return;

    // Skip admins / moderators
    if (message.member.permissions.has('Administrator')) return;
    if (message.member.permissions.has('ManageMessages')) return;

    // Run checks in order (stop after first violation)
    if (await checkToxicWords(message))  return;
    if (await checkMassMention(message)) return;
    if (await checkScam(message))        return;
    if (await checkLinks(message))       return;
    if (await checkEmojiSpam(message))   return;
    if (await checkMentionSpam(message)) return;
}

module.exports = { runAutoMod, checkToxicWords, checkMassMention, checkScam, checkLinks, checkEmojiSpam, checkMentionSpam };
