// ============================================================
//  INET BOT — Master Configuration File
//  All settings, tokens, IDs, thresholds are here.
//  Fill in your values before starting the bot.
// ============================================================

module.exports = {

    // ─────────────────────────────────────────────────────────
    //  BOT CREDENTIALS
    // ─────────────────────────────────────────────────────────
    BOT_TOKEN:  process.env.BOT_TOKEN  || '',
    CLIENT_ID:  process.env.CLIENT_ID  || '1510288429726961716',
    OWNER_ID:   process.env.OWNER_ID   || '1456549998438121556',

    // ─────────────────────────────────────────────────────────
    //  BOT APPEARANCE
    // ─────────────────────────────────────────────────────────
    BOT_NAME:   'INET OFFICIAL KERALA',
    BOT_COLOR:  '#00d2ff',   // Main accent colour (sky blue)
    SUCCESS_COLOR: '#57F287',
    ERROR_COLOR:   '#ED4245',
    WARN_COLOR:    '#FEE75C',
    INFO_COLOR:    '#5865F2',

    // ─────────────────────────────────────────────────────────
    //  CHANNEL IDs  — fill all of these after inviting the bot
    // ─────────────────────────────────────────────────────────
    CHANNELS: {
        WELCOME:      process.env.WELCOME_CHANNEL      || '1461684283327385743',
        VC_LOG:       process.env.VC_LOG_CHANNEL       || '1531981663360389322',
        TEXT_LOG:     process.env.TEXT_LOG_CHANNEL     || '1531981973407535124',
        MOD_LOG:      process.env.MOD_LOG_CHANNEL      || '1531981695425970246',
        TICKET_LOG:   process.env.TICKET_LOG_CHANNEL   || '1529455978142240949', // Open & Claim Logs
        TICKET_CLOSE_LOG: process.env.TICKET_CLOSE_LOG_CHANNEL || '1529476478608216246', // Close logs
        TICKET_TRANSCRIPT: process.env.TICKET_TRANSCRIPT_CHANNEL || '1531265726084808815', // HTML transcripts
        NUKE_ALERT:   process.env.NUKE_ALERT_CHANNEL || '1531981881220923402', // Alert channel
    },

    // ─────────────────────────────────────────────────────────
    //  CATEGORY IDs
    // ─────────────────────────────────────────────────────────
    CATEGORIES: {
        TICKETS_OPEN:   process.env.TICKETS_OPEN_CATEGORY   || '1529455858612830238',
        TICKETS_CLOSED: process.env.TICKETS_CLOSED_CATEGORY || 'TICKETS_CLOSED_CATEGORY_ID_HERE',
    },

    // ─────────────────────────────────────────────────────────
    //  ROLE IDs
    // ─────────────────────────────────────────────────────────
    ROLES: {
        AUTO_ROLE:      process.env.AUTO_ROLE_ID      || '1525961584676049038',      // Given on join
        MUTED_ROLE:     process.env.MUTED_ROLE_ID     || '1508450678354350261',     // Muted role (optional)
        TICKET_SUPPORT: process.env.TICKET_SUPPORT_ROLE || '1461687842362364050', // Can see tickets
        TICKET_ADMIN:   process.env.TICKET_ADMIN_ROLE || '1461687842362364050',    // Full ticket control
        HIGH_RISK_ROLES: ['1461690348450480160'], // Placeholder for admin roles
    },

    // ─────────────────────────────────────────────────────────
    //  AUTO-MODERATION SETTINGS
    // ─────────────────────────────────────────────────────────
    AUTOMOD: {
        ENABLED: true,

        // Toxic / banned words  (case-insensitive match)
        TOXIC_WORDS: [

            // ── English ────────────────────────────────────────────
            'fuck', 'fucker', 'fucking', 'fuk', 'fck', 'fcking', 'f*ck', 'f**k', 'fuq',
            'shit', 'shitty', 'bullshit', 'sh1t', 's***',
            'bitch', 'bitches', 'son of a bitch', 'b!tch', 'b*tch',
            'asshole', 'ass', 'arse', 'a$$', 'dumbass', 'jackass',
            'bastard', 'cunt', 'dick', 'pussy', 'cock', 'penis', 'vagina',
            'whore', 'slut', 'hoe', 'skank',
            'nigger', 'nigga', 'niger', 'n1gga', 'n!gga', 'nigg3r',
            'faggot', 'fag', 'gay insult', 'f4g',
            'retard', 'idiot', 'moron', 'dumbass', 'r3tard',
            'motherfucker', 'mf', 'stfu', 'wtf', 'lmao', 'lmfao',
            'kill yourself', 'kys', 'die', 'suicide',

            // ── Malayalam (Mallu) ──────────────────────────────────
            // User requested
            'thallevoli', 'thallevi', 'thalleyoli',
            'ammeppanni', 'ammeyppanni', 'ammappanni',
            'poori', 'poorii',
            'thevidichi', 'thevidishy',
            // Previously added
            'myre', 'myru', 'mairuh',
            'poolaya', 'poola',
            'thendi', 'thanda',
            'chemban', 'chembante',
            'kunna', 'kunnan',
            'pooru', 'poorru',
            'thayoli', 'thayolli',
            'thavidu', 'thavidichi',
            'oombi', 'oombikko',
            'punda', 'punde',
            'mothalali',
            'vaanam',
            'kothachi',
            'para', 'paraya',
            'kazhuverimon',
            'perinthevidichi',
            'andi', 'andipooram',
            'mondan', 'mandan',
            'pottan',
            'vevidichi',
            'parayipetta',
            'pulayan', 'pulayadi',

            // ── Hindi ──────────────────────────────────────────────
            'madarchod', 'madarcho', 'mc',
            'behenchod', 'behen', 'bc',
            'chutiya', 'chutiye', 'chut',
            'bhosdike', 'bhosdika', 'bhosdi',
            'gandu', 'gaandu',
            'loda', 'lund', 'lauda',
            'randi', 'randdi',
            'haramzada', 'haramkhor', 'harami',
            'saala', 'saali',
            'bakrichod', 'gadha', 'ullu',
            'kutta', 'kutti',
            'kamina', 'kameena',
            'lanat', 'besharam',
            'teri maa ki', 'teri maa',
            'hijda', 'hijra',
            'nikamma', 'chirkut',
            'teri behen', 'maa ki aankh',

            // ── Tamil ──────────────────────────────────────────────
            'oombu', 'ombu',
            'pundai', 'punde',
            'sunni', 'sunna',
            'thevdiya', 'thevdia',
            'koothi', 'kuthi',
            'baadu', 'otha',
            'paiyan', 'erumaikuthi',
            'naaye', 'naye',
            'loosu', 'palayan',
            'sootha', 'soothadi',
            'pavime', 'pavi',
            'kanavan', 'kazhuthai',
            'mudhaya', 'puzhuthida',
            'sakkili', 'sakkiliya',
        ],

        // Mass mention threshold — any message with this many or more @mentions
        MASS_MENTION_THRESHOLD: 5,

        // Auto-timeout duration in milliseconds (default: 5 minutes)
        TIMEOUT_DURATION_MS: 5 * 60 * 1000,  // 300 000 ms = 5 min

        // MrBeast / image scam keyword detection
        SCAM_KEYWORDS: [
            'mrbeast',
            'mr beast',
            'free nitro',
            'claim prize',
            'click here to claim',
            'you won',
            'you have been selected',
            'discord nitro giveaway',
            'steam gift card',
            'free robux',
            '100 subscribers',
            'giveaway bot',
            'bit.ly',
            'tinyurl',
            'grab.tc',
        ],

        // Log channel for auto-mod actions (falls back to TEXT_LOG if not set)
        LOG_CHANNEL: process.env.AUTOMOD_LOG_CHANNEL || null,

        // Anti-link settings
        ANTI_LINK: {
            ENABLED: true,
            // Only enforce anti-link in these channels (e.g. public chat)
            RESTRICTED_CHANNELS: ['1531980701690232963'],
        }
    },

    // ─────────────────────────────────────────────────────────
    //  TICKET SETTINGS
    // ─────────────────────────────────────────────────────────
    TICKETS: {
        MAX_PER_USER: 1,                // Max open tickets per user
        INACTIVITY_CLOSE_HOURS: 48,     // Auto-close after 48h inactivity (set 0 to disable)
        TRANSCRIPT_STYLE: 'html',       // 'html' — rich HTML file
    },

    // ─────────────────────────────────────────────────────────
    //  SUPPORT PANEL SETTINGS
    // ─────────────────────────────────────────────────────────
    SUPPORT_PANEL: {
        BUTTONS: [
            { id: 'ticket_coupon', label: 'Coupon not working', style: 'Secondary' },
            { id: 'ticket_netflix', label: 'Netflix household error', style: 'Secondary' },
            { id: 'ticket_invoice', label: 'Invoice ID', style: 'Secondary' },
            { id: 'ticket_lower_price', label: 'Lower price paid', style: 'Secondary' },
            { id: 'ticket_max_uses', label: 'Maximum uses', style: 'Secondary' },
            { id: 'ticket_vpn', label: 'VPN cases', style: 'Secondary' },
            { id: 'ticket_approval', label: 'Approval time', style: 'Secondary' },
            { id: 'ticket_warranty', label: 'Warranty', style: 'Secondary' },
            { id: 'ticket_replacement', label: 'Apply replacement?', style: 'Secondary' }
        ]
    },

    // ─────────────────────────────────────────────────────────
    //  WELCOME MESSAGE
    // ─────────────────────────────────────────────────────────
    WELCOME: {
        ENABLED: true,
        // The custom message template matching your layout and using your specific emoji IDs
        MESSAGE: '## ✧ Welcome to IMPOSTER NETWORK ✧\n\n> We are thrilled to have you here, {user}!\n> You are our **{count}**th member.\n\n**╭─── Explore ───╮**\n💬 **Chat & Make Friends**\n🎮 **Play Games**\n🌟 **Join Events**\n**╰───────────────────╯**\n\n**Quick Links:**\n<#1531388954815889409> — Server Rules\n<#1531389089495126127> — Need Help? Open a ticket!',
        DM_ENABLED: true,
        DM_MESSAGE: 'Hey {username}! Welcome to **IMPOSTER NETWORK**! 🚀\n\nWe are super excited to have you in the community. Feel free to explore the channels, meet new people, and have a great time!\n\nIf you need anything, don\'t hesitate to open a ticket in the server.',
        BANNER_URL: 'https://media.tenor.com/FwT96dK1G1sAAAAC/welcome-anime.gif',
        FOOTER_TEXT: 'IMPOSTER NETWORK ✨',
    },

    // ─────────────────────────────────────────────────────────
    //  AUTO-REPLIES / AUTO-MESSAGES (Per Channel)
    // ─────────────────────────────────────────────────────────
    AUTO_REPLIES: {
        ENABLED: true,
        CHANNELS: {
            // 'CHANNEL_ID_HERE': 'The message the bot should reply with automatically',
            '1531980701690232963': 'Welcome to the public chat! Please be respectful and enjoy your time here.',
        }
    },

    // ─────────────────────────────────────────────────────────
    //  KEEP-ALIVE  (for Render free tier)
    // ─────────────────────────────────────────────────────────
    KEEPALIVE: {
        ENABLED: true,
        PORT: process.env.PORT || 3000,
    },
};
