const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'genhelp',
  description: 'Show instructions for accessing Free Generator',
  async execute(message, args, client) {
    const divider = "<a:line:1430126271160909854><a:line:1430126271160909854><a:line:1430126271160909854><a:line:1430126271160909854><a:line:1430126271160909854><a:line:1430126271160909854>";

    const embed = new EmbedBuilder()
      .setTitle('<a:Star:1428737971363909763> How to Access Free Generator <a:Star:1428737971363909763>')
      .setDescription('Follow these simple steps to get access to the **Free MCFA Generator!**')
      .setColor('#0000FF')
      .setThumbnail(message.guild.iconURL({ dynamic: true }) || client.user.displayAvatarURL())
      .addFields(
        {
          name: '<a:NEAxe:1428738062703132823> Step 1',
          value: 'Set your custom status to:\n```\n.gg/flarecloud : Free MCFA Generator\n```',
          inline: false
        },
        {
          name: '<a:zapdos:1428738358447702146> Step 2',
          value: 'Go to (<#1448293269456027668>) and type:\n```\n$cstatus\n```',
          inline: false
        },
        {
          name: '<a:tick:1428738634118598706> Step 3',
          value: 'You\'re done! 🎉 You now have access to the **Free Gen**.',
          inline: false
        },
        {
          name: divider,
          value: '\u200b',
          inline: false
        },
        {
          name: ' <a:Books_:1428721941631467605> Important Notes',
          value: '<a:cross:1428738774791098399> Don\'t ping any staff for this.\n' +
            '<a:ticket:1428738796374982676> Need help? Create a ticket in (<#1448293283997552861>).\n' +
            '<a:Warningggg:1428322721133236345> Improper custom status = No access granted.',
          inline: false
        }
      )
      .setFooter({ 
        text: `Free MCFA Generator • FlareCloud • Requested by ${message.author.tag}`, 
        iconURL: message.author.displayAvatarURL() 
      })
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });
  },
};