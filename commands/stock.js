const { EmbedBuilder } = require('discord.js');
const fs = require('fs-extra');
const path = require('path');

const STOCK_PATHS = {
  'Freemium Vault': {
    Mcnfa: 'stock/Mcnfa.txt',
    Xbox: 'stock/Xbox.txt',
    Steam: 'stock/Steam.txt',
    CrunchyRoll: 'stock/CrunchyRoll.txt',
    'Xbox Code': 'stock/Xbox_Code.txt',
    Netflix: 'stock/Netflix.txt'
  },
  'Booster Vault': {
    Mcsfa: 'bosststock/Mcsfa.txt',
    Donut: 'bosststock/Donut.txt',
    Hypixel: 'bosststock/Hypixel.txt'
  }
};

// Animated / custom emoji NAMES on your server (first match wins)
const VAULT_EMOJIS = {
  'Freemium Vault': ['free', 'FREE', 's_yellow', 'Lily_icecream', 'stock'],
  'Booster Vault': ['bosst', 'booster', 'purple_1', 'boost']
};

const ACCOUNT_EMOJIS = {
  Mcnfa: ['s_yellow', 'yellow', 'minecraft', 'MINECRAFT'],
  Xbox: ['s_yellow', 'yellow', 'gold', 'xbox'],
  Steam: ['s_yellow', 'yellow', 'steam'],
  CrunchyRoll: ['s_yellow', 'yellow', 'crunchyroll'],
  'Xbox Code': ['s_yellow', 'yellow', 'gold', 'xbox'],
  Netflix: ['s_yellow', 'yellow', 'netflix'],
  Mcsfa: ['purple_1', 'purple', 'booster', 'bosst', 'minecraft'],
  Donut: ['purple_1', 'purple', 'booster', 'donut'],
  Hypixel: ['purple_1', 'purple', 'booster', 'hypixel']
};

function em(guild, client, names, fallback) {
  try {
    const lowerNames = names.map((n) => String(n).toLowerCase());
    const search = (cache) => {
      if (!cache) return null;
      for (const n of lowerNames) {
        const found = cache.find((e) => e.name.toLowerCase() === n);
        if (found) return found.toString();
      }
      return null;
    };
    return (
      search(guild?.emojis?.cache) ||
      search(client?.emojis?.cache) ||
      fallback
    );
  } catch (_) {
    return fallback;
  }
}

function countLines(relPath) {
  try {
    const full = path.join(__dirname, '..', relPath);
    if (!fs.existsSync(full)) return 0;
    const c = fs.readFileSync(full, 'utf8');
    return c.split(/\r?\n/).filter((l) => l.trim()).length;
  } catch {
    return 0;
  }
}

module.exports = {
  name: 'stock',
  description: 'View all available stock',
  async execute(message, args, client) {
    try {
      const guild = message.guild;
      const title = em(guild, client, ['stock', 'Lily_icecream', 'flare'], '☁️');

      const embed = new EmbedBuilder()
        .setTitle(`${title} FlareCloud Inventory Status ${title}`)
        .setDescription('**```Active inventory stock```**')
        .setColor(0x001000);

      let total = 0;

      for (const [vault, accounts] of Object.entries(STOCK_PATHS)) {
        const vaultEm = em(guild, client, VAULT_EMOJIS[vault] || [], '📦');
        const rows = [];
        for (const [name, file] of Object.entries(accounts)) {
          const n = countLines(file);
          total += n;
          const accEm = em(guild, client, ACCOUNT_EMOJIS[name] || ['s_yellow'], '🔹');
          rows.push(`**${accEm} \`${name}\` → [ ${n} Units ]**`);
        }
        embed.addFields({
          name: `**${vaultEm} ${vault}**`,
          value: rows.join('\n') || 'Empty',
          inline: false
        });
      }

      embed.setFooter({ text: `FlareCloud Inventory | Total: ${total}` });
      await message.reply({ embeds: [embed] });
    } catch (err) {
      console.error('[stock]', err);
      await message.reply(`Stock error: ${err.message}`).catch(() => {});
    }
  }
};
