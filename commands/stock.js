const { EmbedBuilder } = require('discord.js');
const fs = require('fs-extra');
const path = require('path');

const STOCK_PATHS = {
  "Freemium Vault": {
    "Mc_Bedrock": "stock/Mc_Bedrock.txt",
    "Xbox": "stock/Xbox.txt",
    "Cape": "stock/Cape.txt",
    "Minecraft": "stock/Minecraft.txt",
    "Steam": "stock/Steam.txt",
    "Crunchyroll": "stock/Crunchyroll.txt"
  },
  "Booster Vault": {
    "Donut": "booststock/Donut.txt",
    "Unbanned": "booststock/Unbanned.txt"
  },
  "Premium Vault": {
    "Mcfa": "paidstock/Mcfa.txt"
  }
};

// Preferred animated emoji NAMES on your server (first match wins)
const VAULT_EMOJI_NAMES = {
  "Freemium Vault": ["free", "FREE", "Lily_icecream", "stock"],
  "Booster Vault": ["bosst", "booster", "boost"],
  "Premium Vault": ["premium", "paid", "diamond"]
};

const ACCOUNT_EMOJI_NAMES = {
  "Mc_Bedrock": ["s_yellow", "yellow", "HS_Globe", "globe"],
  "Xbox": ["s_yellow", "yellow", "gold"],
  "Minecraft": ["s_yellow", "yellow", "Lily_icecream"],
  "Steam": ["s_yellow", "yellow"],
  "Crunchyroll": ["s_yellow", "yellow"],
  "Cape": ["s_yellow", "yellow", "cape"],
  "Donut": ["purple_1", "purple", "booster", "donut"],
  "Unbanned": ["purple_1", "purple", "booster"],
  "Mcfa": ["blue_sparkle", "sparkle", "paid", "premium"]
};

function findEmoji(guild, names) {
  if (!guild || !names) return null;
  const cache = guild.emojis.cache;
  for (const name of names) {
    const e = cache.find(
      (em) => em.name.toLowerCase() === String(name).toLowerCase()
    );
    if (e) return e.animated ? `<a:${e.name}:${e.id}>` : `<:${e.name}:${e.id}>`;
  }
  return null;
}

function getStockCount(filePath) {
  try {
    const fullPath = path.resolve(__dirname, '..', filePath);
    if (!fs.existsSync(fullPath)) return 0;
    const content = fs.readFileSync(fullPath, 'utf8');
    return content.split('\n').filter((line) => line.trim().length > 0).length;
  } catch {
    return 0;
  }
}

module.exports = {
  name: 'stock',
  async execute(message) {
    const guild = message.guild;

    // Title emoji from server if present
    const titleEm =
      findEmoji(guild, ["warden", "FlareCloud", "flare", "stock", "Lily_icecream"]) ||
      "☁️";

    const embed = new EmbedBuilder()
      .setTitle(`**${titleEm} FlareCloud Inventory Status ${titleEm}**`)
      .setDescription("**```Active inventory stock```**")
      .setColor(0x001000);

    for (const [vault, accounts] of Object.entries(STOCK_PATHS)) {
      let vaultText = "";
      const vaultEm =
        findEmoji(guild, VAULT_EMOJI_NAMES[vault] || []) || "📦";

      for (const [accType, accPath] of Object.entries(accounts)) {
        const emoji =
          findEmoji(guild, ACCOUNT_EMOJI_NAMES[accType] || []) || "🔹";
        const count = getStockCount(accPath);
        vaultText += `**${emoji} \`${accType}\` → [ ${count} Units ]**\n`;
      }

      embed.addFields({
        name: `**${vaultEm} ${vault}**`,
        value: vaultText || "Empty",
        inline: false
      });
    }

    embed.setFooter({ text: "FlareCloud Inventory | Storage System" });
    await message.channel.send({ embeds: [embed] });
  }
};
