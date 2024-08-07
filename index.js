const { Client, GatewayIntentBits } = require('discord.js');
const { checkStatuses } = require('./statusChecker');
const { handleCommands } = require('./commands');

const TOKEN = process.env.DISCORD_TOKEN;

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    setInterval(() => checkStatuses(client), 5 * 60 * 1000); // Checks every 5 minutes
});

//initial server join message
client.on('guildCreate', guild => {
    const defaultChannel = guild.systemChannel || guild.channels.cache.find(channel =>
        channel.permissionsFor(guild.me).has('SEND_MESSAGES') && channel.type === 'GUILD_TEXT'
    );

    if (defaultChannel) {
        defaultChannel.send(`
👋 Hello! I am your FFXIV Server Status Bot. Here are some commands you can use:
1. **!watch <Server> [dm|channel]** - Follow the status of a server. Default notification type is channel. 📡   
2. **!unwatch <Server>** - Unfollow the status of a server. 🚫
3. **!check** - Check which servers you are following. ✅
4. **!dc <datacenter>** - List all servers and their status in a data center. 🌐
5. **!help** - Display this help message. ℹ️
        `);
    }
});

client.on('messageCreate', async message => {
    handleCommands(client, message);
});

client.login(TOKEN);