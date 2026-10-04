const { EmbedBuilder } = require('discord.js');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    name: 'free',
    description: 'Generate a free account',
    async execute(message, args, client) {
        const e = (n, fb='') => (client.resolveEmoji ? client.resolveEmoji(message.guild, n, fb) : (fb || ''));

        const config = client.config;
        const emojis = config.emojis;

        // Channel check FIRST
        if (message.channel.id !== config.genChannelId) {
            const embedWrong = new EmbedBuilder()
                .setTitle(`${e('Wrong')} Wrong Channel`)
                .setDescription(`**${e('arrow_arrow')} Please use this command only in <#1555427957210619964> Stick to the designated channel to use this command.**`)
                .setColor(0x001000);
            return message.reply({ embeds: [embedWrong] });
        }


        // Freemium / free-gen role check
        const freeRoleId = config.freemiumRoleId || config.statusRoleId || '1555427829800239175';
        if (!message.member.roles.cache.has(freeRoleId)) {
            const embedNoRole = new EmbedBuilder()
                .setTitle(`${e('Wrong')} Access Denied`)
                .setDescription(`**You need the Freemium role. Set status to the Official FlareCloud text and use \`$cstatus\`.**`)
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
        const service = config.services[serviceKey];

        if (!service) {
            const embedInvalid = new EmbedBuilder()
                .setTitle(`${e('red_excl')} Service does not exist.`)
                .setDescription(`**${e('arrow_arrow')} Please check $stock for the existing services\n\nEnsure the service name is correct and try again.**`)
                .setColor(0x001000);
            return message.reply({ embeds: [embedInvalid] });
        }

        // ✅ CHECK OUT OF STOCK FIRST
        const stockCount = getStockCount(service.stockFile);
        if (stockCount === 0) {
            const embedNoStock = new EmbedBuilder()
                .setTitle(`${e('red_excl')} Out of Stock`)
                .setDescription(`**${e('arrow_arrow')} Sorry, this service is currently out of stock.**`)
                .setColor(0x001000);
            return message.reply({ embeds: [embedNoStock] });
        }

        // ✅ NOW CHECK IF USER IS BLOCKED
        const vouchSystem = require('./vouch.js');
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
    .setTitle(`${e('s_yellow')} Your Account is Here ${e('s_yellow')}`)
    .setColor(0x57F287)
    .addFields(
        { name: `\u200B`, value: `\u200B`, inline: false },
        { name: `${e('mail')} Email`, value: `||\`\`${email}\`\`||`, inline: true },
        { name: `${e('password')} Password`, value: `||\`\`${password}\`\`||`, inline: true },
        { name: `${e('s_yellow')} Combo`, value: `||\`\`\`${email}:${password}\`\`\`||` },
        { name: `\u200B`, value: `\u200B`, inline: false },        
        { name: `${e('red_excl')} **Vouch Requirement**`, value: `**We kindly request your   
vouch!\nhttps://discord.com/channels/1428026856917045310/1556279907838074970**` }
    )
    .setFooter({
        text: "FlareCloud High Security Systems",
        iconURL:
            "https://cdn.discordapp.com/icons/1428026856917045310/a_f47c020eef6737ce6946cb2bc152f533.webp"
    });

        try {
            await message.author.send({ embeds: [embedDm] });
        } catch (err) {
            return message.reply("❌ Unable to DM you! Please enable DMs from server members.");
        }

        // Public confirmation
        const embedPublic = new EmbedBuilder()
            .setTitle(`${e('success')} Account Generated Successfully!`)
            .setDescription(`**${e('upload')} Your account has been sent to your DMs.**

**${e('s_yellow')} New account generated by ${message.author}**
**${e('s_yellow')} Service generated: ${service.display || serviceKey}**
**${e('s_yellow')} Please vouch in <#1556279907838074970> or else you will be blocked from the gen**`)
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
