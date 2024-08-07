const { getDCServerStatuses, formatServerStatuses } = require('./utils');

let userSelections = {};

const handleCommands = async (client, message) => {
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
            message.reply(`You are currently watching the following servers: ${followedServers.join(', ')}`);
        } else {
            message.reply('You are not watching any servers.');
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
};

module.exports = { handleCommands };
