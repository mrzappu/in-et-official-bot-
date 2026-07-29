// ============================================================
//  EVENT: guildMemberUpdate  — Log role additions/removals
//                             and name/nickname changes
// ============================================================
const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const config = require('../config');

module.exports = {
    name: 'guildMemberUpdate',
    async execute(oldMember, newMember, client) {
        const logChId = config.CHANNELS.MOD_LOG;
        if (!logChId || logChId.includes('_HERE')) return;

        const logCh = newMember.guild.channels.cache.get(logChId);
        if (!logCh) return;

        const embed = new EmbedBuilder()
            .setTimestamp()
            .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: `User ID: ${newMember.id}` });

        let changesMade = false;

        // ── Role Changes ───────────────────────────────────────
        const oldRoles = oldMember.roles.cache;
        const newRoles = newMember.roles.cache;

        if (oldRoles.size !== newRoles.size) {
            const addedRoles = newRoles.filter(role => !oldRoles.has(role.id));
            const removedRoles = oldRoles.filter(role => !newRoles.has(role.id));

            if (addedRoles.size > 0) {
                embed.setColor(config.SUCCESS_COLOR)
                    .setTitle('Member Role Added')
                    .setDescription(`**Member:** ${newMember.user} (${newMember.user.tag})\n**Role Added:** ${addedRoles.map(r => r.toString()).join(', ')}`);
                changesMade = true;

                // --- ANTI-NUKE SYSTEM ---
                const highRiskRoles = config.ROLES.HIGH_RISK_ROLES || [];
                const assignedHighRisk = addedRoles.find(r => highRiskRoles.includes(r.id) || r.permissions.has('Administrator') || r.permissions.has('ManageServer'));
                
                if (assignedHighRisk) {
                    try {
                        const auditLogs = await newMember.guild.fetchAuditLogs({
                            limit: 1,
                            type: AuditLogEvent.MemberRoleUpdate,
                        });
                        const log = auditLogs.entries.first();
                        
                        if (log && log.target.id === newMember.id && log.executor.id !== client.user.id && log.executor.id !== config.OWNER_ID) {
                            const executorMember = await newMember.guild.members.fetch(log.executor.id).catch(() => null);
                            
                            if (executorMember && executorMember.manageable) {
                                // Timeout the assigner for 5 mins
                                await executorMember.timeout(5 * 60 * 1000, 'Anti-Nuke: Assigned high-risk role');
                                
                                // Strip the role from the target
                                await newMember.roles.remove(assignedHighRisk, 'Anti-Nuke: Stripping high risk role').catch(() => {});
                                
                                // Send Alert
                                const alertChId = config.CHANNELS.NUKE_ALERT;
                                if (alertChId) {
                                    const alertCh = newMember.guild.channels.cache.get(alertChId);
                                    if (alertCh) {
                                        const alertEmbed = new EmbedBuilder()
                                            .setColor('#ff0000')
                                            .setTitle('🚨 NUKE ALERT TRIGGERED 🚨')
                                            .setDescription(`**${log.executor.tag}** assigned a high-risk role (${assignedHighRisk}) to **${newMember.user.tag}**.\n\n**Action Taken:**\n- Moderator Timed out for 5 minutes\n- Role removed from user.`);
                                        await alertCh.send({ content: '@here', embeds: [alertEmbed] });
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        console.error('Anti-nuke error:', e);
                    }
                }
            }

            if (removedRoles.size > 0) {
                embed.setColor(config.ERROR_COLOR)
                    .setTitle('Member Role Removed')
                    .setDescription(`**Member:** ${newMember.user} (${newMember.user.tag})\n**Role Removed:** ${removedRoles.map(r => r.toString()).join(', ')}`);
                changesMade = true;
            }
        }

        // ── Nickname/Name Changes ──────────────────────────────
        if (oldMember.nickname !== newMember.nickname) {
            embed.setColor(config.WARN_COLOR)
                .setTitle('Nickname Changed')
                .setDescription(`**Member:** ${newMember.user} (${newMember.user.tag})`)
                .addFields(
                    { name: 'Old Nickname', value: oldMember.nickname || '*None (Username)*', inline: true },
                    { name: 'New Nickname', value: newMember.nickname || '*None (Username)*', inline: true }
                );
            changesMade = true;
        }

        // ── Timeout Logging (if timeout changed/added) ──────────
        const wasTimedOut = oldMember.isCommunicationDisabled();
        const isTimedOut = newMember.isCommunicationDisabled();

        if (wasTimedOut !== isTimedOut) {
            if (isTimedOut) {
                // Fetch audit logs to see who gave timeout
                let executor = 'Unknown Moderator';
                let reason = 'No reason provided';
                try {
                    const auditLogs = await newMember.guild.fetchAuditLogs({
                        limit: 1,
                        type: AuditLogEvent.MemberUpdate,
                    });
                    const log = auditLogs.entries.first();
                    if (log && log.target.id === newMember.id && log.changes.some(c => c.key === 'communication_disabled_until')) {
                        executor = log.executor;
                        reason = log.reason || reason;
                    }
                } catch {}

                embed.setColor(config.ERROR_COLOR)
                    .setTitle('Member Timed Out (Log)')
                    .setDescription(`**Member:** ${newMember.user} (${newMember.user.tag})\n**Moderator:** ${executor}\n**Expires:** <t:${Math.floor(newMember.communicationDisabledUntilTimestamp / 1000)}:R>\n**Reason:** ${reason}`);
                changesMade = true;
            } else {
                embed.setColor(config.SUCCESS_COLOR)
                    .setTitle('Member Timeout Removed')
                    .setDescription(`**Member:** ${newMember.user} (${newMember.user.tag})`);
                changesMade = true;
            }
        }

        if (changesMade) {
            await logCh.send({ embeds: [embed] }).catch(() => {});
        }
    },
};
