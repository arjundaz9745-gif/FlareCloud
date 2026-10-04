const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'genhelp',
  description: 'Show instructions for accessing Free Generator',
  async execute(message, args, client) {
        const e = (n, fb='') => (client.resolveEmoji ? client.resolveEmoji(message.guild, n, fb) : (fb || ''));

    const divider = `${e('line')}${e('line')}${e('line')}${e('line')}${e('line')}${e('line')}`;

    const embed = new EmbedBuilder()
      .setTitle(`${e('Star')} How to Access Free Generator ${e('Star')}`)
      .setDescription('Follow these simple steps to get access to the **Official FlareCloud access!**')
      .setColor('#0000FF')
      .setThumbnail(message.guild.iconURL({ dynamic: true }) || client.user.displayAvatarURL())
      .addFields(
        {
          name: `${e('NEAxe')} Step 1`,
          value: 'Set your custom status to:\n```\nFree G3n/Toolz at .gg/G4uywBjmgU\n```',
          inline: false
        },
        {
          name: `${e('zapdos')} Step 2`,
          value: 'Go to (<#1555427972008386590>) and type:\n```\n$cstatus\n```',
          inline: false
        },
        {
          name: `${e('tick')} Step 3`,
          value: 'You\'re done! 🎉 You now have access to **Official FlareCloud** free gen.',
          inline: false
        },
        {
          name: divider,
          value: '\u200b',
          inline: false
        },
        {
          name: ` ${e('Books_')} Important Notes`,
          value: `${e('cross')} Don\'t ping any staff for this.\n` +
            `${e('ticket')} Need help? Create a ticket in (<#1448293283997552861>).\n` +
            `${e('Warningggg')} Improper custom status = No access granted.`,
          inline: false
        }
      )
      .setFooter({ 
        text: `Official FlareCloud • Requested by ${message.author.tag}`, 
        iconURL: message.author.displayAvatarURL() 
      })
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });
  },
};