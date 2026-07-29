const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Displays a list of available commands and bot features.'),

    async execute(interaction, client) {
        const embed = new EmbedBuilder()
            .setColor(config.BOT_COLOR || '#2b2d31')
            .setTitle('IMPOSTER NETWORK - Help Menu')
            .setDescription('Select a category from the dropdown menu below to see the available commands.')
            .setThumbnail(client.user.displayAvatarURL())
            .setFooter({ text: 'IMPOSTER NETWORK ✨', iconURL: client.user.displayAvatarURL() });

        const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('help_menu')
                .setPlaceholder('Select a category...')
                .addOptions([
                    {
                        label: 'Moderation',
                        description: 'Commands for managing the server.',
                        value: 'moderation',
                        emoji: '🛡️',
                    },
                    {
                        label: 'Setup / Utility',
                        description: 'Commands for setting up the bot.',
                        value: 'setup',
                        emoji: '⚙️',
                    }
                ])
        );

        const response = await interaction.reply({ embeds: [embed], components: [row], ephemeral: true, fetchReply: true });

        // Create a collector for the dropdown
        const collector = response.createMessageComponentCollector({ filter: i => i.user.id === interaction.user.id, time: 60000 });

        collector.on('collect', async i => {
            const category = i.values[0];
            let newEmbed = new EmbedBuilder().setColor(config.BOT_COLOR || '#2b2d31');

            if (category === 'moderation') {
                newEmbed.setTitle('🛡️ Moderation Commands')
                        .setDescription('`/ban` - Ban a user\n`/unban` - Unban a user\n`/kick` - Kick a user\n`/timeout` - Timeout a user\n`/untimeout` - Remove timeout');
            } else if (category === 'setup') {
                newEmbed.setTitle('⚙️ Setup & Utility')
                        .setDescription('`/supportpanel` - Deploy the Help Center panel\n`/help` - Show this menu');
            }

            await i.update({ embeds: [newEmbed], components: [row] });
        });

        collector.on('end', () => {
            // Remove components when collector ends
            interaction.editReply({ components: [] }).catch(() => {});
        });
    },
};
