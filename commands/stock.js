const { EmbedBuilder } = require('discord.js');
const fs = require('fs-extra');
const path = require('path');

// Real paths on Linux/Render (case-sensitive)
const STOCK_PATHS = {
  'Freemium Vault': {
    Mc_Bedrock: 'stock/Mc_Bedrock.txt',
    Xbox: 'stock/Xbox.txt',
    Cape: 'stock/Cape.txt',
    Minecraft: 'stock/Minecraft.txt',
    Steam: 'stock/Steam.txt',
    Crunchyroll: 'stock/Crunchyroll.txt'
  },
  'Booster Vault': {
    Donut: 'bosststock/Donut.txt',
    Unbanned: 'bosststock/Unbanned.txt'
  },
  'Premium Vault': {
    Mcfa: 'paidstock/mcfa.txt'
  }
};

function countLines(relPath) {
  try {
    const full = path.join(__dirname, '..', relPath);
    if (!fs.existsSync(full)) {
      // try alternate case for mcfa
      const alt = full.replace(/mcfa\.txt$/i, 'Mcfa.txt');
      if (fs.existsSync(alt)) {
        const c = fs.readFileSync(alt, 'utf8');
        return c.split(/\r?\n/).filter((l) => l.trim()).length;
      }
      return 0;
    }
    const c = fs.readFileSync(full, 'utf8');
    return c.split(/\r?\n/).filter((l) => l.trim()).length;
  } catch (e) {
    console.error('[stock] read fail', relPath, e.message);
    return 0;
  }
}

function em(guild, names, fallback) {
  try {
    if (!guild?.emojis?.cache) return fallback;
    for (const n of names) {
      const found = guild.emojis.cache.find(
        (e) => e.name.toLowerCase() === String(n).toLowerCase()
      );
      if (found) return found.toString();
    }
  } catch (_) {}
  return fallback;
}

module.exports = {
  name: 'stock',
  description: 'View all available stock',
  async execute(message, args, client) {
    console.log(`[stock] ran by ${message.author?.tag} in #${message.channel?.name}`);
    try {
      const guild = message.guild;
      const title = em(guild, ['stock', 'flare', 'Lily_icecream'], '☁️');

      const embed = new EmbedBuilder()
        .setTitle(`${title} FlareCloud Inventory Status ${title}`)
        .setDescription('```Active inventory stock```')
        .setColor(0x001000);

      let total = 0;
      const lines = [];

      for (const [vault, accounts] of Object.entries(STOCK_PATHS)) {
        const rows = [];
        for (const [name, file] of Object.entries(accounts)) {
          const n = countLines(file);
          total += n;
          rows.push(`🔹 \`${name}\` → [ **${n}** Units ]`);
        }
        embed.addFields({
          name: `📦 ${vault}`,
          value: rows.join('\n') || 'Empty',
          inline: false
        });
        lines.push(`**${vault}**\n${rows.join('\n')}`);
      }

      embed.setFooter({
        text: `Total: ${total} accounts | $restock to add more`
      });

      // Prefer reply; fallback to channel send; fallback to plain text
      try {
        await message.reply({ embeds: [embed] });
      } catch (e1) {
        console.error('[stock] reply failed', e1.message);
        try {
          await message.channel.send({ embeds: [embed] });
        } catch (e2) {
          console.error('[stock] channel send failed', e2.message);
          await message.channel.send(
            `**FlareCloud Stock** (total ${total})\n\n${lines.join('\n\n')}`
          );
        }
      }
    } catch (err) {
      console.error('[stock] fatal', err);
      try {
        await message.reply(`❌ Stock error: ${err.message}`);
      } catch (_) {
        await message.channel.send(`❌ Stock error: ${err.message}`).catch(() => {});
      }
    }
  }
};
