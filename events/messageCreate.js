// ============================================================
//  EVENT: messageCreate  — Auto-mod runner
//  Works in: Text channels, Voice channel text chats, Threads,
//             Stage channels, Forum posts — ALL text-based areas
// ============================================================
const { ChannelType } = require('discord.js');
const config = require('../config');
const { runAutoMod } = require('../handlers/autoModHandler');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author?.bot) return;
        if (!message.guild)      return;

        // ── Ensure we handle ALL text-capable channels ────────
        // This includes: GuildText, GuildVoice (voice chat),
        // GuildAnnouncement, GuildStageVoice, Threads, Forums
        const supportedTypes = [
            ChannelType.GuildText,
            ChannelType.GuildVoice,        // Voice channel text chat ← KEY FIX
            ChannelType.GuildAnnouncement,
            ChannelType.GuildStageVoice,
            ChannelType.PublicThread,
            ChannelType.PrivateThread,
            ChannelType.AnnouncementThread,
            ChannelType.GuildForum,
        ];
        if (!supportedTypes.includes(message.channel.type)) return;

        // Auto-replies per channel
        if (config.AUTO_REPLIES && config.AUTO_REPLIES.ENABLED) {
            const autoMsg = config.AUTO_REPLIES.CHANNELS[message.channel.id];
            if (autoMsg) {
                message.reply(autoMsg).then(msg => {
                    setTimeout(() => msg.delete().catch(() => {}), 15000);
                }).catch(() => {});
            }
        }

        await runAutoMod(message);
    },
};
