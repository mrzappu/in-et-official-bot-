// ============================================================
//  COMMAND: /unban
// ============================================================

const { SlashCommandBuilder, PermissionFlagsBits, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize } = require('discord.js');
const config = require('../../config');
const { modLogEmbed, CV2_FLAGS, replyError } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban a user from the server')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addStringOption(o => o.setName('user_id').setDescription('User ID to unban').setRequired(true))
        .addStringOption(o => o.setName('reason').setDescription('Reason for unban')),

    async execute(interaction) {
        const userId = interaction.options.getString('user_id').trim();
        const reason = interaction.options.getString('reason') || 'No reason provided';

        await interaction.deferReply({ ephemeral: false });

        let user;
        try {
            user = await interaction.client.users.fetch(userId);
        } catch {
            return replyError(interaction, 'Invalid user ID or user not found.');
        }

        // Check if actually banned
        try {
            await interaction.guild.bans.fetch(userId);
        } catch {
            return replyError(interaction, `${user.tag} is not banned from this server.`);
        }

        await interaction.guild.members.unban(userId, reason);

        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
            .setColor(config.SUCCESS_COLOR || '#57F287')
            .setTitle('Member Unbanned')
            .setDescription(`**User:** ${user.tag} (${user.id})\n**Moderator:** ${interaction.user.tag}\n**Reason:** ${reason}`)
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

        const logChId = config.CHANNELS.MOD_LOG;
        if (logChId && !logChId.includes('_HERE')) {
            const logCh = interaction.guild.channels.cache.get(logChId);
            if (logCh) {
                await logCh.send({ embeds: [modLogEmbed({
                    action: 'Unban',
                    target: user,
                    executor: interaction.user,
                    reason,
                    color: config.SUCCESS_COLOR,
                })] });
            }
        }
    },
};
