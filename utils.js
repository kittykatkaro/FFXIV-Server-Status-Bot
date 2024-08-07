const axios = require('axios');
const cheerio = require('cheerio');

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

            const onlineStatus = statusIcon.hasClass('available') ? 'Online' : 'Offline';

            servers.push({ name: worldName, category: worldCategory, status: `${status} (${onlineStatus})` });
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

module.exports = { getServerStatus, getDCServerStatuses, formatServerStatuses };
