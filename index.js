// ============================================================
//  INET BOT — Entry Point
//  Loads commands, events, keep-alive server, and logs in
// ============================================================
try { require('dotenv').config(); } catch (err) { /* ignore in production */ }

const {
    Client,
    GatewayIntentBits,
    Collection,
    REST,
    Routes,
} = require('discord.js');
const fs   = require('fs');
const path = require('path');
const http = require('http');

const config = require('./config');
const { initDatabase } = require('./utils/database');
const {
    printHeader,
    printLoading,
    printSuccess,
    printError,
    printInfo,
    printWarn,
    colors,
} = require('./utils/logger');

// ─────────────────────────────────────────────────────────────
//  Print startup banner
// ─────────────────────────────────────────────────────────────
printHeader();

// ─────────────────────────────────────────────────────────────
//  Discord Client
// ─────────────────────────────────────────────────────────────
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildModeration,
    ],
});

client.commands = new Collection();

// ─────────────────────────────────────────────────────────────
//  Load Commands  (recursive — walks all subdirectories)
// ─────────────────────────────────────────────────────────────
printLoading('Command modules');

function loadCommandsFrom(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            loadCommandsFrom(fullPath);
        } else if (entry.name.endsWith('.js')) {
            const command = require(fullPath);
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
            } else {
                printWarn(`Skipped invalid command file: ${entry.name}`);
            }
        }
    }
}

loadCommandsFrom(path.join(__dirname, 'commands'));
printSuccess(`Commands loaded (${client.commands.size} total)`);

// ─────────────────────────────────────────────────────────────
//  Load Events
// ─────────────────────────────────────────────────────────────
printLoading('Event handlers');

const eventsPath = path.join(__dirname, 'events');
let loadedEvents = 0;

if (fs.existsSync(eventsPath)) {
    for (const file of fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'))) {
        const event = require(path.join(eventsPath, file));
        if (!event.name || !event.execute) {
            printWarn(`Skipped invalid event: ${file}`);
            continue;
        }
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
        loadedEvents++;
    }
}

printSuccess(`Event handlers loaded (${loadedEvents} events)`);

// ─────────────────────────────────────────────────────────────
//  Register Slash Commands with Discord API
// ─────────────────────────────────────────────────────────────
async function registerCommands() {
    const commands = [...client.commands.values()].map(c => c.data.toJSON());
    const rest = new REST({ version: '10' }).setToken(config.BOT_TOKEN);

    printLoading('Slash commands (Discord API)');
    await rest.put(Routes.applicationCommands(config.CLIENT_ID), { body: commands });
    printSuccess(`Slash commands registered (${commands.length})`);
}

// ─────────────────────────────────────────────────────────────
//  Keep-Alive HTTP Server  (Render free tier stays awake)
// ─────────────────────────────────────────────────────────────
if (config.KEEPALIVE.ENABLED) {
    const server = http.createServer((req, res) => {
        if (req.url === '/ping') {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('INET Bot is alive!');
        } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            const bootTime = Date.now();
            res.end(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>INET OFFICIAL KERALA | Dashboard</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #00d2ff;
            --secondary: #3a7bd5;
            --bg-color: #0d0f14;
            --panel-bg: rgba(20, 24, 33, 0.6);
            --border-color: rgba(255, 255, 255, 0.1);
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
            min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;
            background: var(--bg-color); color: #e2e8f0; 
            font-family: 'Outfit', sans-serif; 
            background-image: 
                radial-gradient(circle at 15% 50%, rgba(0, 210, 255, 0.08), transparent 25%),
                radial-gradient(circle at 85% 30%, rgba(58, 123, 213, 0.08), transparent 25%);
            overflow-x: hidden;
        }
        .container {
            width: 90%; max-width: 800px;
            animation: floatIn 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
            opacity: 0; transform: translateY(30px);
        }
        .glass-panel { 
            background: var(--panel-bg); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
            border: 1px solid var(--border-color); border-radius: 24px;
            padding: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.4);
            position: relative; overflow: hidden;
        }
        .glass-panel::before {
            content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
            background: linear-gradient(45deg, transparent, rgba(255,255,255,0.03), transparent);
            transform: rotate(45deg); animation: shimmer 6s infinite linear; pointer-events: none;
        }
        .header { text-align: center; margin-bottom: 30px; }
        h1 { 
            font-size: 3rem; font-weight: 800; margin-bottom: 5px;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            letter-spacing: 2px;
        }
        .tagline { color: #94a3b8; font-size: 1.1rem; font-weight: 300; }
        
        .status-pill {
            display: inline-flex; align-items: center; background: rgba(87, 242, 135, 0.1);
            color: #57F287; padding: 10px 20px; border-radius: 50px; border: 1px solid rgba(87, 242, 135, 0.2);
            margin: 20px auto; font-weight: 600; letter-spacing: 1px;
        }
        .status-dot { 
            width: 10px; height: 10px; border-radius: 50%; background: #57F287;
            margin-right: 12px; box-shadow: 0 0 10px #57F287; animation: pulse 2s infinite; 
        }
        
        .stats-grid {
            display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;
        }
        .stat-card {
            background: rgba(255,255,255,0.02); border: 1px solid var(--border-color);
            padding: 25px; border-radius: 16px; text-align: center;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .stat-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,210,255,0.1); border-color: rgba(0,210,255,0.3); }
        .stat-value { font-size: 2.2rem; font-weight: 800; color: #fff; margin-bottom: 5px; font-variant-numeric: tabular-nums; }
        .stat-label { font-size: 0.9rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
        
        .features { margin-top: 30px; text-align: center; }
        .features h3 { margin-bottom: 15px; color: #fff; font-size: 1.5rem; }
        .feature-list { display: flex; justify-content: center; gap: 15px; flex-wrap: wrap; }
        .feature-badge {
            background: rgba(58, 123, 213, 0.1); color: var(--primary); border: 1px solid rgba(58, 123, 213, 0.3);
            padding: 8px 16px; border-radius: 8px; font-size: 0.9rem; font-weight: 600;
        }

        .footer { text-align: center; margin-top: 40px; color: #475569; font-size: 0.9rem; }
        .footer span { color: var(--primary); font-weight: 600; }

        @keyframes pulse { 0%,100%{opacity:1; transform: scale(1);} 50%{opacity:0.5; transform: scale(0.8);} }
        @keyframes floatIn { to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { transform: translateX(-100%) rotate(45deg); } 100% { transform: translateX(200%) rotate(45deg); } }
    </style>
</head>
<body>
    <div class="container">
        <div class="glass-panel">
            <div class="header">
                <h1>INET OFFICIAL</h1>
                <div class="tagline">Advanced Discord Community Management</div>
                
                <div class="status-pill">
                    <span class="status-dot"></span> SYSTEM ONLINE
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value" id="uptime">00:00:00</div>
                    <div class="stat-label">Uptime</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">99.9%</div>
                    <div class="stat-label">Server Health</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">0ms</div>
                    <div class="stat-label">Latency Status</div>
                </div>
            </div>

            <div class="features">
                <h3>Active Modules</h3>
                <div class="feature-list">
                    <span class="feature-badge">Advanced Tickets</span>
                    <span class="feature-badge">Anti-Nuke Protection</span>
                    <span class="feature-badge">AI Auto-Mod</span>
                    <span class="feature-badge">Economy & Shop</span>
                </div>
            </div>
        </div>
        
        <div class="footer">
            Powered by <span>INET Network</span> &bull; Discord.js v14
        </div>
    </div>

    <script>
        const bootTime = ${bootTime};
        setInterval(() => {
            const diff = Math.floor((Date.now() - bootTime) / 1000);
            const h = Math.floor(diff / 3600).toString().padStart(2, '0');
            const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
            const s = (diff % 60).toString().padStart(2, '0');
            document.getElementById('uptime').innerText = \`\${h}:\${m}:\${s}\`;
        }, 1000);
    </script>
</body>
</html>`);
        }
    });

    server.listen(config.KEEPALIVE.PORT, () => {
        printSuccess(`Keep-alive server on port ${config.KEEPALIVE.PORT}`);
    });
}

// ─────────────────────────────────────────────────────────────
//  Ready event hook — register commands after login
// ─────────────────────────────────────────────────────────────
client.once('ready', async () => {
    try {
        await registerCommands();
    } catch (err) {
        printError(`Failed to register commands: ${err.message}`);
    }
});

// ─────────────────────────────────────────────────────────────
//  Error handling
// ─────────────────────────────────────────────────────────────
client.on('error', err => printError(`Client error: ${err.message}`));

process.on('unhandledRejection', err => {
    if (err?.code === 10062 || err?.message?.includes('Unknown interaction')) return;
    printError(`Unhandled rejection: ${err?.message}`);
    console.error(err);
});

process.on('uncaughtException', err => {
    printError(`Uncaught exception: ${err.message}`);
    console.error(err);
    process.exit(1);
});

process.on('SIGINT', () => {
    console.log(`\n${colors.YELLOW}⚠${colors.RESET}  Shutting down INET Bot...`);
    client.destroy();
    process.exit(0);
});

// ─────────────────────────────────────────────────────────────
//  Startup — Init DB first, then login
// ─────────────────────────────────────────────────────────────
async function startup() {
    try {
        printLoading('SQLite database (INET.db)');
        await initDatabase();
        printSuccess('Database ready — INET.db');
    } catch (err) {
        printError(`Database init failed: ${err.message}`);
        process.exit(1);
    }

    printLoading('Discord authentication');
    client.login(config.BOT_TOKEN).catch(err => {
        printError(`Failed to login: ${err.message}`);
        process.exit(1);
    });
}

startup();
