const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../config');
const { replyError, CV2_FLAGS } = require('../../utils/embedBuilder');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dm')
        .setDescription('Direct message a user from the bot')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addUserOption(o => o.setName('user').setDescription('User to message').setRequired(true))
        .addStringOption(o => o.setName('message').setDescription('Message content').setRequired(true))
        .addBooleanOption(o => o.setName('add_ticket_button').setDescription('Add a button to open a ticket in the server?')),

    async execute(interaction) {
        const target = interaction.options.getUser('user');
        const messageContent = interaction.options.getString('message');
        const addTicketBtn = interaction.options.getBoolean('add_ticket_button') || false;

        const embed = new EmbedBuilder()
            .setColor(config.INFO_COLOR || '#5865F2')
            .setTitle(`Message from ${interaction.guild.name}`)
            .setDescription(messageContent)
            .setFooter({ text: `Sent by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        const components = [];
        if (addTicketBtn) {
            // Add a button that links to the server or instructs them how to open a ticket
            // Since DMs can't natively trigger server commands easily without complex setups, we'll give them a link to the ticket channel
            const btn = new ButtonBuilder()
                .setLabel('Open a Ticket')
                .setStyle(ButtonStyle.Link)
                .setURL(`https://discord.com/channels/${interaction.guild.id}/${config.CHANNELS.WELCOME}`); // fallback to welcome or they can go to the ticket channel
            
            components.push(new ActionRowBuilder().addComponents(btn));
        }

        try {
            await target.send({ embeds: [embed], components });
            
            const successEmbed = new EmbedBuilder()
                .setColor(config.SUCCESS_COLOR || '#57F287')
                .setDescription(`✅ Successfully sent a DM to ${target.tag}.`);
            
            await interaction.reply({ embeds: [successEmbed], flags: CV2_FLAGS });
        } catch (err) {
            return replyError(interaction, `Failed to send DM to ${target.tag}. Their DMs might be disabled.`);
        }
    },
};
