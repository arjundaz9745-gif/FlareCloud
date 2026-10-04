const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs-extra');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// 🧱 Vault structure
const STOCK_PATHS = {
  "Freemium": {
    "Mc_Bedrock": "stock/Mc_Bedrock.txt",
    "Xbox": "stock/Xbox.txt",
    "Cape": "stock/Cape.txt",
    "Minecraft": "stock/Minecraft.txt",
    "Crunchyroll": "stock/Crunchyroll.txt",
    "Steam": "stock/Steam.txt"
  },
  "Booster": {
    "Donut": "bosststock/Donut.txt",
    "Unbanned": "booststock/Unbanned.txt"
  },
  "Premium": {
    "Mcfa": "paidstock/Mcfa.txt"
  }
};

module.exports = {
  name: 'restock',
  description: 'Restock vaults with account files',
  async execute(message, args, client) {
        const e = (n, fb='') => (client.resolveEmoji ? client.resolveEmoji(message.guild, n, fb) : (fb || ''));

    // 🧾 Admin-only protection
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply(`${e('wrong')} You do not have permission to use this command.`);
    }

    // 🧾 Check syntax
    if (args.length < 2) {
      const embed = new EmbedBuilder()
        .setTitle(`${e('stock')} Restock Command Help`)
        .setDescription(
          '**Usage:** `$restock <vault> <service>` + attach `.txt` file\n\n' +
          '**Example:** `$restock Freemium Mc_Bedrock`\n\n' +
          '**Available Vaults & Services:**\n' +
          Object.entries(STOCK_PATHS)
            .map(([vault, services]) => `**${vault}** → ${Object.keys(services).join(', ')}`)
            .join('\n')
        )
        .setColor(0x5865F2);
      return message.reply({ embeds: [embed] });
    }

    const [vaultNameRaw, serviceNameRaw] = args;
    const vaultName = vaultNameRaw.charAt(0).toUpperCase() + vaultNameRaw.slice(1).toLowerCase();
    const serviceName = serviceNameRaw;

    // 🔍 Validate vault + service
    const vault = STOCK_PATHS[vaultName];
    if (!vault) return message.reply(`${e('wrong')} Invalid vault. Use \`$restock\` to view available vaults.`);

    const filePath = vault[serviceName];
    if (!filePath) return message.reply(`${e('wrong')} Invalid service name for this vault.`);

    // 📎 Require attachment
    if (message.attachments.size === 0) {
      return message.reply(`${e('file')} Please attach a \`.txt\` file containing accounts.`);
    }

    const attachment = message.attachments.first();
    if (!attachment.name.endsWith('.txt')) {
      return message.reply(`${e('wrong')} Only \`.txt\` files are allowed.`);
    }

    try {
      const response = await fetch(attachment.url);
      const text = await response.text();
      const accounts = text.split('\n').filter(line => line.trim().length > 0);

      if (accounts.length === 0) {
        return message.reply(`${e('wrong')} No valid accounts found in the file.`);
      }

      const fullPath = path.resolve(process.cwd(), filePath);
      fs.ensureFileSync(fullPath);

      const existingContent = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : '';
      const newContent =
        existingContent +
        (existingContent && !existingContent.endsWith('\n') ? '\n' : '') +
        accounts.join('\n') +
        '\n';

      fs.writeFileSync(fullPath, newContent, 'utf8');

      const totalStock = getStockCount(filePath);

      // ============================
      //  📤 SUCCESS EMBED
      // ============================
      const embed = new EmbedBuilder()
        .setTitle(`${e('file')} Restock Successful`)
        .setDescription(
          `**Vault:** ${vaultName}\n` +
          `**Service:** ${serviceName}\n` +
          `**Accounts Added:** ${accounts.length}\n` +
          `**Total Stock:** ${totalStock}`
        )
        .setColor(0x57F287)
        .setTimestamp();

      await message.reply({ embeds: [embed] });

// 📤 Send Success Embed to Restock Channel
// Try to load from config.json (channelIds)
// Try to load from config.json (channelIds)
let restockChannelId = client.config?.channelIds?.restockChannelId;

// If not found, try to load directly from index.js config
if (!restockChannelId) {
    restockChannelId = client.config?.restockChannelId;
}

if (restockChannelId) {
    const restockChannel = message.guild.channels.cache.get(restockChannelId);

    if (restockChannel) {
        restockChannel.send({ embeds: [embed] });
    } else {
        console.log("❌ Restock Channel not found in this guild.");
    }
} else {
    console.log("❌ restockChannelId missing in both channelIds and index.js config.");
}


      // ============================
      // 🧾 SEND LOGS (IF ENABLED)
      // ============================
      const logsChannelId = client.config?.logsChannelId;
      if (logsChannelId && logsChannelId !== '1428026859043426349') {
        const logsChannel = message.guild.channels.cache.get(logsChannelId);
        if (logsChannel) {
          const logsEmbed = new EmbedBuilder()
            .setTitle(`${e('file')} Service Restocked`)
            .setDescription(`**Vault:** ${vaultName}\n**Service:** ${serviceName}`)
            .addFields(
              { name: 'Accounts Added', value: `${accounts.length}`, inline: true },
              { name: 'Total Stock', value: `${totalStock}`, inline: true },
              { name: 'Restocked By', value: `${message.author.tag}`, inline: false }
            )
            .setColor(0x57F287)
            .setTimestamp();
          await logsChannel.send({ embeds: [logsEmbed] });
        }
      }
    } catch (error) {
      console.error('Restock error:', error);
      await message.reply(`${e('Error')} Failed to restock. Please check console logs.`);
    }
  }
};

// 📊 Count total accounts in file
function getStockCount(filePath) {
  try {
    const fullPath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) return 0;
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    return lines.length;
  } catch {
    return 0;
  }
}
