const {
    SlashCommandBuilder,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
    MessageFlags,
} = require('discord.js');
const config = require('../../config.js');
const { CV2_FLAGS } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('supportpanel')
        .setDescription('Sends the support ticket panel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(o =>
            o.setName('channel')
            .setDescription('Channel to send the panel in (defaults to current)')
            .setRequired(false)
        ),

    async execute(interaction) {
        const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

        // Build the CV2 panel
        const container = new ContainerBuilder();

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `## 🎫 Support Center\n> **Welcome to INET Official Support**\nOur team is here to assist you with any questions or issues.`
            )
        );

        container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `**What we can help you with:**\n` +
                `> 🏷️ Coupon & pricing issues\n` +
                `> 📺 Netflix / streaming errors\n` +
                `> 🧾 Invoice & payment queries\n` +
                `> 🔁 Warranty & replacements\n` +
                `> 🌐 VPN & access issues\n` +
                `> ⏱️ Approval time queries`
            )
        );

        container.addSeparatorComponents(
            new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `-# Click the button below to open a support ticket. Our team will respond as soon as possible.`
            )
        );

        // Single open ticket button
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('ticket_create')
                .setLabel('🎫 Open Ticket Now')
                .setStyle(ButtonStyle.Primary)
        );

        container.addActionRowComponents(row);

        await interaction.reply({ content: '✅ Panel sent!', flags: MessageFlags.Ephemeral });
        await targetChannel.send({ components: [container], flags: CV2_FLAGS });
    }
};
