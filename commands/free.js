const { EmbedBuilder } = require('discord.js');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    name: 'free',
    description: 'Generate a free account',
    async execute(message, args, client) {
        const config = client.config;
        const emojis = config.emojis;

        // Channel check FIRST
        if (message.channel.id !== config.genChannelId) {
            const embedWrong = new EmbedBuilder()
                .setTitle(`<a:Wrong:1428669341838217216> Wrong Channel`)
                .setDescription(`**<a:arrow_arrow:1428669723234668680> Please use this command only in <#1428668980951908495> Stick to the designated channel to use this command.**`)
                .setColor(0x001000);
            return message.reply({ embeds: [embedWrong] });
        }

        // Service validation
        if (args.length === 0) {
            const embedNoArgs = new EmbedBuilder()
                .setTitle(`<a:red_excl:1428670056719450142> Service does not exist.`)
                .setDescription(`**<a:arrow_arrow:1428669723234668680> Please check $stock for the existing services\n\nEnsure the service name is correct and try again.**`)
                .setColor(0x001000);
            return message.reply({ embeds: [embedNoArgs] });
        }

        const serviceKey = args.join("_").toLowerCase();
        const service = config.services[serviceKey];

        if (!service) {
            const embedInvalid = new EmbedBuilder()
                .setTitle(`<a:red_excl:1428670056719450142> Service does not exist.`)
                .setDescription(`**<a:arrow_arrow:1428669723234668680> Please check $stock for the existing services\n\nEnsure the service name is correct and try again.**`)
                .setColor(0x001000);
            return message.reply({ embeds: [embedInvalid] });
        }

        // ✅ CHECK OUT OF STOCK FIRST
        const stockCount = getStockCount(service.stockFile);
        if (stockCount === 0) {
            const embedNoStock = new EmbedBuilder()
                .setTitle(`<a:red_excl:1428670056719450142> Out of Stock`)
                .setDescription(`**<a:arrow_arrow:1428669723234668680> Sorry, this service is currently out of stock.**`)
                .setColor(0x001000);
            return message.reply({ embeds: [embedNoStock] });
        }

        // ✅ NOW CHECK IF USER IS BLOCKED
        const vouchSystem = require('./vouch.js');
        if (vouchSystem.isUserBlockedFromGen(message.guild, message.author.id)) {
            const embedBlocked = new EmbedBuilder()
                .setTitle(`<a:Wrong:1428669341838217216> Gen Access Blocked`)
                .setDescription(`**<a:arrow_arrow:1428669723234668680> You are temporarily blocked from using generator commands.**\n\n**Reason:** You did not vouch in time.\n\n**Appeal here:** <#1428026858624258051>`)
                .setColor(0xFF0000);
            return message.reply({ embeds: [embedBlocked] });
        }

        // ✅ REGISTER FOR VOUCH (ONLY NOW, AFTER ALL CHECKS)
        vouchSystem.registerMemberForVouch(message.guild, message.member, message.id, client, message.channel.id);

        // Generate account
        const account = getAccount(service.stockFile);
        if (!account) {
            const embedError = new EmbedBuilder()
                .setTitle(`<a:red_excl:1428670056719450142> Error`)
                .setDescription(`**<a:arrow_arrow:1428669723234668680> Unable to retrieve account. Please try again later.**`)
                .setColor(0x001000);
            return message.reply({ embeds: [embedError] });
        }

        // Parse account details
        const parts = account.combo.trim().split(":");
        const email = parts[0] || "N/A";
        const password = parts[1] || "N/A";

        // Send DM
const embedDm = new EmbedBuilder()
    .setTitle(`<a:s_yellow:1428642510539849864> Your Account is Here <a:s_yellow:1428642510539849864>`)
    .setColor(0x57F287)
    .addFields(
        { name: `\u200B`, value: `\u200B`, inline: false },
        { name: `<a:mail:1428674492284145725> Email`, value: `||\`\`${email}\`\`||`, inline: true },
        { name: `<a:password:1428674545702932531> Password`, value: `||\`\`${password}\`\`||`, inline: true },
        { name: `<a:s_yellow:1428642510539849864> Combo`, value: `||\`\`\`${email}:${password}\`\`\`||` },
        { name: `\u200B`, value: `\u200B`, inline: false },        
        { name: `<a:red_excl:1428670056719450142> **Vouch Requirement**`, value: `**We kindly request your   
vouch!\nhttps://discord.com/channels/1428026856917045310/1448293264951087247**` }
    )
    .setFooter({
        text: "FlareCloud High Security Systems",
        iconURL:
            "https://cdn.discordapp.com/icons/1428026856917045310/a_f47c020eef6737ce6946cb2bc152f533.webp"
    });

        try {
            await message.author.send({ embeds: [embedDm] });
        } catch (e) {
            return message.reply("❌ Unable to DM you! Please enable DMs from server members.");
        }

        // Public confirmation
        const embedPublic = new EmbedBuilder()
            .setTitle(`<a:success:1428670642538152058> Account Generated Successfully!`)
            .setDescription(`**<a:upload:1428673194155442196> Your account has been sent to your DMs.**

**<a:s_yellow:1428642510539849864> New account generated by ${message.author}**
**<a:s_yellow:1428642510539849864> Service generated: ${service.display || serviceKey}**
**<a:s_yellow:1428642510539849864> Please vouch in <#1448293264951087247> or else you will be blocked from the gen**`)
            .setColor(0x001000)
            .setFooter({
                text: 'FlareCloud Generator',
                iconURL: 'https://cdn.discordapp.com/icons/1428026856917045310/a_f47c020eef6737ce6946cb2bc152f533.webp'
            });

        await message.reply({ embeds: [embedPublic] });
    }
};

function getStockCount(filePath) {
    try {
        const fullPath = path.resolve(__dirname, '..', filePath);
        if (!fs.existsSync(fullPath)) return 0;
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim().length > 0);
        return lines.length;
    } catch (err) {
        return 0;
    }
}

function getAccount(filePath) {
    try {
        const fullPath = path.resolve(__dirname, '..', filePath);
        if (!fs.existsSync(fullPath)) return null;

        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim().length > 0);

        if (lines.length === 0) return null;

        const account = lines[0];
        const remainingLines = lines.slice(1);

        fs.writeFileSync(fullPath, remainingLines.join('\n') + (remainingLines.length > 0 ? '\n' : ''), 'utf8');

        return { combo: account };
    } catch (err) {
        return null;
    }
}
