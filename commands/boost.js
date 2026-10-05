const { EmbedBuilder } = require('discord.js');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    name: 'bgen',
    description: 'Generate a booster account',
    async execute(message, args, client) {
        const e = (n, fb='') => (client.resolveEmoji ? client.resolveEmoji(message.guild, n, fb) : (fb || ''));

        const config = client.config;
        const emojis = config.emojis;
        const vouchSystem = require('./vouch.js');

        // ✅ Channel check
        if (message.channel.id !== config.boosterChannelId) {
            const embedWrong = new EmbedBuilder()
                .setTitle(`${e('Wrong')} Wrong Channel`)
                .setDescription(`**${e('arrow_arrow')} Please use this command only in <#${config.boosterChannelId}>.**`)
                .setColor(0x001000);
            return message.reply({ embeds: [embedWrong] });
        }

        // ✅ Service validation
        if (args.length === 0) {
            const embedNoArgs = new EmbedBuilder()
                .setTitle(`${e('red_excl')} Service does not exist.`)
                .setDescription(`**Please check $stock for existing services and ensure the service name is correct.**`)
                .setColor(0x001000);
            return message.reply({ embeds: [embedNoArgs] });
        }

        const serviceKeyRaw = args.join("_");
        const serviceKey = serviceKeyRaw.toLowerCase();
        const allServices = Object.keys(config.services);

        // Case-insensitive service matching
        const matchedKey = allServices.find(key => key.toLowerCase() === serviceKey);
        if (!matchedKey) {
            const embedInvalid = new EmbedBuilder()
                .setTitle(`${e('red_excl')} Invalid Service`)
                .setDescription(`**Service '${serviceKeyRaw}' not found. Please check $stock for available booster services.**`)
                .setColor(0x001000);
            return message.reply({ embeds: [embedInvalid] });
        }

        const service = config.services[matchedKey];

        console.log(`[GEN] Service selected: ${matchedKey}`);
        console.log(`[GEN] Stock file path (raw): ${service.stockFile}`);

        // ✅ Resolve full stock path
        let stockPath = path.resolve(process.cwd(), service.stockFile);
        console.log(`[GEN] Full path resolved to: ${stockPath}`);

        // ✅ Handle case-sensitive file systems (Linux)
        if (!fs.existsSync(stockPath)) {
            const dir = path.dirname(stockPath);
            const base = path.basename(stockPath).toLowerCase();
            if (fs.existsSync(dir)) {
                const files = fs.readdirSync(dir);
                const match = files.find(f => f.toLowerCase() === base);
                if (match) {
                    stockPath = path.join(dir, match);
                    console.log(`[GEN] Matched actual file: ${stockPath}`);
                }
            }
        }

        // ✅ Check stock count
        const stockCount = getStockCount(stockPath);
        console.log(`[GEN] Stock count: ${stockCount}`);

        if (stockCount === 0) {
            const embedNoStock = new EmbedBuilder()
                .setTitle(`${e('red_excl')} Out of Stock`)
                .setDescription(`**Sorry, this booster service is currently out of stock.**`)
                .setColor(0x001000);
            return message.reply({ embeds: [embedNoStock] });
        }

        // ✅ Check if user blocked
        if (vouchSystem.isUserBlockedFromGen(message.guild, message.author.id)) {
            const embedBlocked = new EmbedBuilder()
                .setTitle(`${e('Wrong')} Gen Access Blocked`)
                .setDescription(`**You are temporarily blocked from using generator commands.**\n\n**Reason:** You did not vouch in time.\n**Appeal here:** <#1555427972008386590>`)
                .setColor(0xFF0000);
            return message.reply({ embeds: [embedBlocked] });
        }

        // ✅ Register user for vouch
        vouchSystem.registerMemberForVouch(message.guild, message.member, message.id, client, message.channel.id);

        // ✅ Generate account
        const account = getAccount(stockPath);
        console.log(`[GEN] Account pulled: ${account}`);

        if (!account) {
            const embedError = new EmbedBuilder()
                .setTitle(`${e('red_excl')} Error`)
                .setDescription(`**Unable to retrieve account. Please try again later.**`)
                .setColor(0x001000);
            return message.reply({ embeds: [embedError] });
        }

        // ✅ Parse account details
        const [email, password] = account.trim().split(":");

        // ✅ Send DM
const embedDm = new EmbedBuilder()
    .setTitle(`${e('s_yellow')} Your Booster Account is Here ${e('s_yellow')}`)
    .setColor(0x9B59B6)
    .addFields(
        { name: `\u200B`, value: `\u200B`, inline: false },
        { name: `${e('mail')} Email`, value: `||\`\`${email}\`\`||`, inline: true },
        { name: `${e('password')} Password`, value: `||\`\`${password}\`\`||`, inline: true },
        { name: `${e('s_yellow')} Combo`, value: `||\`\`\`${email}:${password}\`\`\`||` },
        { name: `\u200B`, value: `\u200B`, inline: false },        
        { name: `${e('red_excl')} **Vouch Requirement**`, value: `**We kindly request your vouch!\nhttps://discord.com/channels/1428026856917045310/1556279907838074970**` }
    .setFooter("FlareCloud High Security Systems", "https://cdn.discordapp.com/icons/1428026856917045310/a_f47c020eef6737ce6946cb2bc152f533.webp")
    );

        try {
            await message.author.send({ embeds: [embedDm] });
        } catch (err) {
            return message.reply("❌ Unable to DM you! Please enable DMs from server members.");
        }

        // ✅ Public confirmation
        const embedPublic = new EmbedBuilder()
            .setTitle(`${e('success')} Booster Account Generated!`)
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

// ✅ Functions

function getStockCount(stockPath) {
    try {
        if (!fs.existsSync(stockPath)) {
            console.log(`[GEN] File does not exist: ${stockPath}`);
            return 0;
        }

        const content = fs.readFileSync(stockPath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim().length > 0);
        return lines.length;
    } catch (err) {
        console.error(`[GEN] Error reading stock count:`, err);
        return 0;
    }
}

function getAccount(stockPath) {
    try {
        if (!fs.existsSync(stockPath)) return null;

        const content = fs.readFileSync(stockPath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim().length > 0);
        if (lines.length === 0) return null;

        const account = lines[0];
        const remaining = lines.slice(1);

        fs.writeFileSync(stockPath, remaining.join('\n') + (remaining.length ? '\n' : ''), 'utf8');
        return account;
    } catch (err) {
        console.error(`[GEN] Error getting account:`, err);
        return null;
    }
}
