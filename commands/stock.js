const { EmbedBuilder } = require('discord.js');
const fs = require('fs-extra');
const path = require('path');

// Each vault has stock files (one file per service)
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
    "Mcfa": "stock/Mcfa.txt",
  }
};


const VAULT_EMOJIS = {
  "Freemium Vault": "<a:free:1428657081048895528>",
  "Booster Vault": "<a:bosst:1428618472102821978>",
  "Premium Vault": "<a:premium:1428657142025555968>"
};

const ACCOUNT_EMOJIS = {
  "Mc_Bedrock": "<a:s_yellow:1428642510539849864>",
  "Xbox": "<a:s_yellow:1428642510539849864>",
  "Minecraft": "<a:s_yellow:1428642510539849864>",
  "Steam": "<a:s_yellow:1428642510539849864>", 
  "Crunchyroll": "<a:s_yellow:1428642510539849864>", 
  "Cape": "<a:s_yellow:1428642510539849864>",
  "Donut": "<a:purple_1:1428633287798161468>",
  "Unbanned": "<a:purple_1:1428633287798161468>",
  "Mcfa": "<a:blue_sparkle:1428642431733071882>",  
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

module.exports = {
  name: 'stock',
  async execute(message) {
    const embed = new EmbedBuilder()
      .setTitle('**<:warden:1428643359785750600> FlareCloud Inventory Status <:warden:1428643359785750600>**')
      .setDescription('**```Active inventory stock```**')
      .setColor(0x001000);

    for (const [vault, accounts] of Object.entries(STOCK_PATHS)) {
      let vaultText = '';
      for (const [accType, accPath] of Object.entries(accounts)) {
        const emoji = ACCOUNT_EMOJIS[accType] || '📦';
        const count = getStockCount(accPath);
        vaultText += `**${emoji} \`${accType}\` → [ ${count} Units ]**\n`;
      }
      embed.addFields({
        name: `**${VAULT_EMOJIS[vault] || ''} ${vault}**`,
        value: vaultText,
        inline: false
      });
    }
    embed.setFooter({ 
      text: 'FlareCloud Inventory | Storage System',
      iconURL: 'https://cdn.discordapp.com/icons/1428026856917045310/a_f47c020eef6737ce6946cb2bc152f533.webp'
    });

    await message.channel.send({ embeds: [embed] });
  }
};
