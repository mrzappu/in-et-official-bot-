// ============================================================
//  EVENT: messageCreate  — Auto-mod runner
// ============================================================
const config = require('../config');
const { runAutoMod } = require('../handlers/autoModHandler');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author?.bot) return;
        if (!message.guild)      return;

        // Auto-replies per channel
        if (config.AUTO_REPLIES && config.AUTO_REPLIES.ENABLED) {
            const autoMsg = config.AUTO_REPLIES.CHANNELS[message.channel.id];
            if (autoMsg) {
                // Send auto reply. Optionally delete it after 15s to keep chat clean.
                message.reply(autoMsg).then(msg => {
                    setTimeout(() => msg.delete().catch(() => {}), 15000);
                }).catch(() => {});
            }
        }

        await runAutoMod(message);
    },
};
