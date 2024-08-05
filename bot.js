const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');

const TOKEN = 'DISCORD_TOKEN';

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

let serverStatuses = {};
let userSelections = {};

// Get the status of a server
const getServerStatus = async (server) => {
    try {
        const { data } = await axios.get('https://eu.finalfantasyxiv.com/lodestone/worldstatus/');
        const $ = cheerio.load(data);

        const serverElement = $(`.world-list__world_name:contains(${server})`).closest('.world-list__item');
        const statusIcon = serverElement.find('.world-list__create_character i');
        const status = statusIcon.attr('data-tooltip').trim();

        return status;
    } catch (error) {
        console.error('Error fetching status:', error);
        return null;
    }
};

// Get all servers and their status from a datacenter
const getDCServerStatuses = async (dataCenter) => {
    try {
        const { data } = await axios.get('https://eu.finalfantasyxiv.com/lodestone/worldstatus/');
        const $ = cheerio.load(data);

        let servers = [];

        $(`h2.world-dcgroup__header:contains(${dataCenter})`).next('ul').find('.world-list__item').each((_, element) => {
            const worldName = $(element).find('.world-list__world_name p').text().trim();
            const worldCategory = $(element).find('.world-list__world_category p').text().trim();
            const statusIcon = $(element).find('.world-list__create_character i');
            const status = statusIcon.attr('data-tooltip').trim();

            servers.push({ name: worldName, category: worldCategory, status });
        });

        return servers;
    } catch (error) {
        console.error('Error fetching DC server statuses:', error);
        return [];
    }
};

// Format server statuses into a table
const formatServerStatuses = (servers) => {
    let table = '```\n';
    table += '| Server Name | Category   | Status                             |\n';
    table += '|-------------|------------|------------------------------------|\n';
    servers.forEach(server => {
        table += `| ${server.name.padEnd(11)} | ${server.category.padEnd(10)} | ${server.status.padEnd(34)} |\n`;
    });
    table += '```';
    return table;
};

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    setInterval(checkStatuses, 5 * 60 * 1000); // Checks every 5 minutes
});

const checkStatuses = async () => {
    for (const server of Object.keys(userSelections)) {
        const currentStatus = await getServerStatus(server);
        if (currentStatus) {
            const previousStatus = serverStatuses[server];
            if (currentStatus !== previousStatus) {
                serverStatuses[server] = currentStatus;
                for (const userId of userSelections[server].ids) {
                    const user = await client.users.fetch(userId);
                    if (userSelections[server].notificationType === 'dm') {
                        if (currentStatus === 'Creation of New Characters Available') {
                            user.send(`The status of ${server} has changed to: Creation of New Characters Available!`);
                        } else if (previousStatus === 'Creation of New Characters Available') {
                            user.send(`The status of ${server} has changed to: Creation of New Characters Unavailable.`);
                        }
                    } else {
                        const channel = await client.channels.fetch(userSelections[server].channelId);
                        if (currentStatus === 'Creation of New Characters Available') {
                            channel.send(`The status of ${server} has changed to: Creation of New Characters Available!`);
                        } else if (previousStatus === 'Creation of New Characters Available') {
                            channel.send(`The status of ${server} has changed to: Creation of New Characters Unavailable.`);
                        }
                    }
                }
            }
        }
    }
};

client.on('messageCreate', async message => {
    if (message.content.startsWith('!watch ')) {
        const args = message.content.split(' ');
        const server = args[1];
        const notificationType = args[2] ? args[2].toLowerCase() : 'channel'; // Default to channel
        const allowedTypes = ['dm', 'channel'];

        if (server) {
            if (!allowedTypes.includes(notificationType)) {
                message.reply(`Invalid notification type. Please specify 'dm' or 'channel'. Example: !watch Phoenix channel`);
                return;
            }

            if (!userSelections[server]) {
                userSelections[server] = { ids: [], notificationType: notificationType, channelId: message.channel.id };
            }
            if (!userSelections[server].ids.includes(message.author.id)) {
                userSelections[server].ids.push(message.author.id);
                message.reply(`You will now be notified via ${notificationType === 'dm' ? 'Direct Message' : 'Channel'} when the status of ${server} changes.`);
            } else {
                message.reply(`You are already watching the status of ${server}.`);
            }
        } else {
            message.reply('Please specify a server to watch. Example: !watch Phoenix');
        }
    }

    if (message.content.startsWith('!unwatch ')) {
        const server = message.content.split(' ')[1];
        if (server && userSelections[server]) {
            const index = userSelections[server].ids.indexOf(message.author.id);
            if (index > -1) {
                userSelections[server].ids.splice(index, 1);
                message.reply(`You will no longer be notified about ${server}.`);
            } else {
                message.reply(`You are not watching the status of ${server}.`);
            }
        } else {
            message.reply('Please specify a server to unwatch. Example: !unwatch Phoenix');
        }
    }

    if (message.content.startsWith('!check')) {
        const followedServers = Object.keys(userSelections).filter(server => userSelections[server].ids.includes(message.author.id));
        if (followedServers.length > 0) {
            message.reply(`You are currently following the following servers: ${followedServers.join(', ')}`);
        } else {
            message.reply('You are not following any servers.');
        }
    }

    if (message.content.startsWith('!dc')) {
        const dc = message.content.split(' ')[1];
        if (dc) {
            const servers = await getDCServerStatuses(dc);
            if (servers.length > 0) {
                const statusMessage = formatServerStatuses(servers);
                message.channel.send(statusMessage);
            } else {
                message.reply('No servers found for the specified data center.');
            }
        } else {
            message.reply('Please specify a data center. Example: !dc Light');
        }
    }

    if (message.content.startsWith('!help')) {
        const helpMessage = `
**Available Commands:**
1. **!watch <Server> [dm|channel]** - Follow the status of a server. Default notification type is channel.    
2. **!unwatch <Server>** - Unfollow the status of a server.
3. **!check** - Check which servers you are following.
4. **!dc <datacenter>** - List all servers and their status in a data center.
5. **!help** - Display this help message.
        `;
        message.reply(helpMessage);
    }
});

client.login(TOKEN);
