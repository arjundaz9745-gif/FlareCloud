const { EmbedBuilder } = require('discord.js');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    name: 'pgen',
    description: 'Generate a VIP/Premium account',
    async execute(message, args, client) {
        const e = (n, fb='') => (client.resolveEmoji ? client.resolveEmoji(message.guild, n, fb) : (fb || ''));

        const config = client.config;
        const emojis = config.emojis;
        const vouchSystem = require('./vouch.js');

        // Channel check FIRST
        if (message.channel.id !== config.vipChannelId) {
            const embedWrong = new EmbedBuilder()
                .setTitle(`${e('Wrong')} Wrong Channel`)
                .setDescription(`**${e('arrow_arrow')} Please use this command only in <#${config.vipChannelId}> Stick to the designated channel to use this command.**`)
                .setColor(0x001000);
            return message.reply({ embeds: [embedWrong] });
        }


        // Premium role check
        const premiumRoleId = config.premiumRoleId || '1556280665140363274';
        if (!message.member.roles.cache.has(premiumRoleId)) {
            const embedNoRole = new EmbedBuilder()
                .setTitle(`${e('Wrong')} Premium Required`)
                .setDescription(`**You need the Premium role to use VIP gen.**`)
                .setColor(0x001000);
            return message.reply({ embeds: [embedNoRole] });
        }

        // Service validation
        if (args.length === 0) {
            const embedNoArgs = new EmbedBuilder()
                .setTitle(`${e('red_excl')} Service does not exist.`)
                .setDescription(`**${e('arrow_arrow')} Please check $stock for the existing services\n\nEnsure the service name is correct and try again.**`)
                .setColor(0x001000);
            return message.reply({ embeds: [embedNoArgs] });
        }

        const serviceKey = args.join("_").toLowerCase();
        const service = config.vipServices[serviceKey];

        if (!service) {
            const embedInvalid = new EmbedBuilder()
                .setTitle(`${e('red_excl')} Service does not exist.`)
                .setDescription(`**${e('arrow_arrow')} Please check $stock for the existing VIP services\n\nEnsure the service name is correct and try again.**`)
                .setColor(0x001000);
            return message.reply({ embeds: [embedInvalid] });
        }

        // ✅ CHECK OUT OF STOCK FIRST - DO NOT TRIGGER VOUCH SYSTEM
        const stockCount = getStockCount(service.stockFile);
        if (stockCount === 0) {
            const embedNoStock = new EmbedBuilder()
                .setTitle(`${e('red_excl')} Out of Stock`)
                .setDescription(`**${e('arrow_arrow')} Sorry, this VIP service is currently out of stock.**`)
                .setColor(0x001000);
            return message.reply({ embeds: [embedNoStock] });
        }

        // ✅ NOW CHECK IF USER IS BLOCKED FROM GEN (ONLY IF NOT OUT OF STOCK)
        if (vouchSystem.isUserBlockedFromGen(message.guild, message.author.id)) {
            const embedBlocked = new EmbedBuilder()
                .setTitle(`${e('Wrong')} Gen Access Blocked`)
                .setDescription(`**${e('arrow_arrow')} You are temporarily blocked from using generator commands.**\n\n**Reason:** You did not vouch in time.\n\n**Appeal here:** <#1555427972008386590>`)
                .setColor(0xFF0000);
            return message.reply({ embeds: [embedBlocked] });
        }

        // ✅ REGISTER FOR VOUCH (ONLY NOW, AFTER ALL CHECKS)
        vouchSystem.registerMemberForVouch(message.guild, message.member, message.id, client, message.channel.id);

        // Generate account
        const account = getAccount(service.stockFile);
        if (!account) {
            const embedError = new EmbedBuilder()
                .setTitle(`${e('red_excl')} Error`)
                .setDescription(`**${e('arrow_arrow')} Unable to retrieve account. Please try again later.**`)
                .setColor(0x001000);
            return message.reply({ embeds: [embedError] });
        }

        // Parse account details
        const parts = account.combo.trim().split(":");
        const email = parts[0] || "N/A";
        const password = parts[1] || "N/A";

        // Send DM
        const embedDm = new EmbedBuilder()
            .setTitle(`${e('blue_sparkle')} Your VIP Premium Account ${e('blue_sparkle')}`)
            .setDescription(`**${e('mail')} Email**
\`\`${email}\`\`
**${e('password')} Password**
\`\`${password}\`\`
**${e('blue_sparkle')} Combo**
\`\`\`${email}:${password}\`\`\`

**${e('red_excl')} VOUCHING REQUIREMENT**
**We kindly request your vouch!** https://discord.com/channels/1428026856917045310/1556279907838074970`)
            .setColor(0x3498DB);

        try {
            await message.author.send({ embeds: [embedDm] });
        } catch (err) {
            return message.reply("❌ Unable to DM you! Please enable DMs from server members.");
        }

        // Public confirmation
        const serviceEmoji = emojis[service.emoji] || '📦';
        const embedPublic = new EmbedBuilder()
            .setTitle(`${e('success')} VIP Premium Account Generated Successfully!`)
            .setDescription(`**${e('upload')} Your VIP premium account has been sent to your DMs.**

**${e('blue_sparkle')} VIP account generated by ${message.author}**
**${e('blue_sparkle')} Service generated: Premium ${service.display || serviceKey}**
**${e('blue_sparkle')} Please vouch in <#1556279907838074970> or else you will be blocked from the gen**`)
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
