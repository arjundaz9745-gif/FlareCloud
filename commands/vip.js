const { EmbedBuilder } = require('discord.js');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    name: 'vip',
    description: 'Generate a VIP/Premium account',
    async execute(message, args, client) {
        const config = client.config;
        const emojis = config.emojis;
        const vouchSystem = require('./vouch.js');

        // Channel check FIRST
        if (message.channel.id !== config.vipChannelId) {
            const embedWrong = new EmbedBuilder()
                .setTitle(`<a:Wrong:1428669341838217216> Wrong Channel`)
                .setDescription(`**<a:arrow_arrow:1428669723234668680> Please use this command only in <#${config.vipChannelId}> Stick to the designated channel to use this command.**`)
                .setColor(0x001000);
            return message.reply({ embeds: [embedWrong] });
        }


        // Premium role check
        const premiumRoleId = config.premiumRoleId || '1556280665140363274';
        if (!message.member.roles.cache.has(premiumRoleId)) {
            const embedNoRole = new EmbedBuilder()
                .setTitle(`<a:Wrong:1428669341838217216> Premium Required`)
                .setDescription(`**You need the Premium role to use VIP gen.**`)
                .setColor(0x001000);
            return message.reply({ embeds: [embedNoRole] });
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
        const service = config.vipServices[serviceKey];

        if (!service) {
            const embedInvalid = new EmbedBuilder()
                .setTitle(`<a:red_excl:1428670056719450142> Service does not exist.`)
                .setDescription(`**<a:arrow_arrow:1428669723234668680> Please check $stock for the existing VIP services\n\nEnsure the service name is correct and try again.**`)
                .setColor(0x001000);
            return message.reply({ embeds: [embedInvalid] });
        }

        // ✅ CHECK OUT OF STOCK FIRST - DO NOT TRIGGER VOUCH SYSTEM
        const stockCount = getStockCount(service.stockFile);
        if (stockCount === 0) {
            const embedNoStock = new EmbedBuilder()
                .setTitle(`<a:red_excl:1428670056719450142> Out of Stock`)
                .setDescription(`**<a:arrow_arrow:1428669723234668680> Sorry, this VIP service is currently out of stock.**`)
                .setColor(0x001000);
            return message.reply({ embeds: [embedNoStock] });
        }

        // ✅ NOW CHECK IF USER IS BLOCKED FROM GEN (ONLY IF NOT OUT OF STOCK)
        if (vouchSystem.isUserBlockedFromGen(message.guild, message.author.id)) {
            const embedBlocked = new EmbedBuilder()
                .setTitle(`<a:Wrong:1428669341838217216> Gen Access Blocked`)
                .setDescription(`**<a:arrow_arrow:1428669723234668680> You are temporarily blocked from using generator commands.**\n\n**Reason:** You did not vouch in time.\n\n**Appeal here:** <#1555427972008386590>`)
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
            .setTitle(`<a:blue_sparkle:1428642431733071882> Your VIP Premium Account <a:blue_sparkle:1428642431733071882>`)
            .setDescription(`**<a:mail:1428674492284145725> Email**
\`\`${email}\`\`
**<a:password:1428674545702932531> Password**
\`\`${password}\`\`
**<a:blue_sparkle:1428642431733071882> Combo**
\`\`\`${email}:${password}\`\`\`

**<a:red_excl:1428670056719450142> VOUCHING REQUIREMENT**
**We kindly request your vouch!** https://discord.com/channels/1428026856917045310/1556279907838074970`)
            .setColor(0x3498DB);

        try {
            await message.author.send({ embeds: [embedDm] });
        } catch (e) {
            return message.reply("❌ Unable to DM you! Please enable DMs from server members.");
        }

        // Public confirmation
        const serviceEmoji = emojis[service.emoji] || '📦';
        const embedPublic = new EmbedBuilder()
            .setTitle(`<a:success:1428670642538152058> VIP Premium Account Generated Successfully!`)
            .setDescription(`**<a:upload:1428673194155442196> Your VIP premium account has been sent to your DMs.**

**<a:blue_sparkle:1428642431733071882> VIP account generated by ${message.author}**
**<a:blue_sparkle:1428642431733071882> Service generated: Premium ${service.display || serviceKey}**
**<a:blue_sparkle:1428642431733071882> Please vouch in <#1556279907838074970> or else you will be blocked from the gen**`)
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
