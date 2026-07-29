const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const config = require('../../config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('supportpanel')
        .setDescription('Sends the support panel with ticket buttons.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(config.BOT_COLOR || '#2b2d31')
            .setTitle('Help Center')
            .setDescription('Here you\'ll find quick answers to the most common questions about:\nCoupons\nPayments\nAccess errors\nWarranties and replacements.')
            .setFooter({ text: config.WELCOME.FOOTER_TEXT || 'IMPOSTER NETWORK Support' });

        // Create action rows based on config buttons
        const rows = [];
        let currentRow = new ActionRowBuilder();
        
        config.SUPPORT_PANEL.BUTTONS.forEach((btn, index) => {
            const button = new ButtonBuilder()
                .setCustomId(btn.id)
                .setLabel(btn.label)
                .setStyle(ButtonStyle[btn.style] || ButtonStyle.Secondary);
            
            currentRow.addComponents(button);

            // Action rows can hold max 5 buttons
            if (currentRow.components.length === 5 || index === config.SUPPORT_PANEL.BUTTONS.length - 1) {
                rows.push(currentRow);
                currentRow = new ActionRowBuilder();
            }
        });

        await interaction.reply({ content: 'Sending panel...', ephemeral: true });
        await interaction.channel.send({ embeds: [embed], components: rows });
    }
};
