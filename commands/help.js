const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'help',
  description: 'Show the FlareCloud Generator Help Panel',
  async execute(message, args, client) {
    const emojis = client.config.emojis; // Use your central emojis object from config
    const embed = new EmbedBuilder()
      .setTitle(`${emojis.ice_cube} FlareCloud Generator Help Panel`)
      .setDescription(
        `Use the commands below based on your access tier.\nEach command must be used in its correct channel.`
      )
      .setColor(0x001000)
      .addFields(
        {
          name: `${emojis.globe}  |  Account Generation`,
          value:
            `${emojis.gold} \`$free <service>          →  Free tier account\`\n` +
            `${emojis.booster} \`$bosst <service>         →  Booster tier account\`\n` +
            `${emojis.paid} \`$vip <service>           →  Paid tier account\``
        },
        {
          name: `${emojis.stock}  |  Stock & Cooldowns`,
          value:
            `${emojis.stock} \`$stock                   →  View all available stock\`\n` +
            `${emojis.stock} \`$removestock              →  Clear the stock\`\n` +
            `${emojis.restock} \`$restock                 →  Send restock ping (admin)\`` 
        },
        {
          name: `${emojis.Moderation}  |  Security & Moderation`,
          value:
            `${emojis.ban_hammer} \`$ban <user>              →  Ban user permanently\`\n` +
            `${emojis.timer} \`$tempban <user> <m>       →  Temporarily ban a user\`\n` +
            `${emojis.unlock_s} \`$unban <user>            →  Unban a user\`\n` +
            `${emojis.stop_sign} \`$setbantime <min>       →  Set tempban duration for no vouch\``
        },
        {
          name: `${emojis.books}  |  Utility & Status`,
          value:
            `${emojis.search} \`$cstatus                 →  Verify by setting custom status\``
        }
      )
      .setFooter({ text: 'FlareCloud Systems • Command Guide' });
    await message.reply({ embeds: [embed] });
  }
};
