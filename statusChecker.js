const { getServerStatus, getDCServerStatuses } = require('./utils');

let serverStatuses = {};
let maintenanceStatuses = {};

const checkStatuses = async (client) => {
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

    // Check data centers for maintenance status
    const dataCenters = ['Chaos', 'Light', 'Shadow', 'Crystal', 'Dynamis', 'Aether', 'Primal', 'Materia', 'Elemental', 'Gaia', 'Mana', 'Meteor'];
    for (const dc of dataCenters) {
        const servers = await getDCServerStatuses(dc);
        const allMaintenance = servers.every(server => server.status.includes('Unavailable'));
        const allOnline = servers.every(server => server.status.includes('Available'));

        if (allMaintenance && !maintenanceStatuses[dc]) {
            maintenanceStatuses[dc] = true;
            client.channels.cache.forEach(channel => {
                channel.send(`:red_circle: All worlds in the ${dc} data center are under maintenance. :red_circle: `);
            });
        } else if (allOnline && maintenanceStatuses[dc]) {
            maintenanceStatuses[dc] = false;
            client.channels.cache.forEach(channel => {
                channel.send(`:green_circle: All worlds in the ${dc} data center are now online. :green_circle: `);
            });
        }
    }
};

module.exports = { checkStatuses };
