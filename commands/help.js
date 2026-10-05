const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'help',
  description: 'FlareCloud Generator Help Panel',
  async execute(message, args, client) {
    const e = (n, fb = '') =>
      client.resolveEmoji ? client.resolveEmoji(message.guild, n, fb) : fb;

    const arrow = e('arrow_1', '»');
    const verified = e('verified', '✅');
    const hashtag = e('hashtag', '#');

    const embed = new EmbedBuilder()
      .setTitle(`${hashtag} FlareCloud Generator Help`)
      .setColor(0x001000)
      .setDescription('Use the correct channel for each tier.')
      .addFields(
        {
          name: `${arrow} Account Generation`,
          value:
            `\`-fgen <service>\` → Free tier\n` +
            `\`-bgen <service>\` → Booster tier\n` +
            `\`-pgen <service>\` → Premium tier ($5)`
        },
        {
          name: `${arrow} Stock`,
          value:
            `\`-stock\` → View stock\n` +
            `\`-restock\` → Restock (admin)\n` +
            `\`-removestock\` → Clear stock (admin)`
        },
        {
          name: `${arrow} Access`,
          value:
            `\`-cstatus\` → Verify free-gen status\n` +
            `\`-genhelp\` → Full access guide`
        },
        {
          name: `${verified} Free status text`,
          value: '```\nfree g3n/t00ls at .gg/noobies\n```'
        },
        {
          name: `${arrow} Premium`,
          value: `**$5** — DM <@1398979148063571989> to buy access`
        }
      )
      .setFooter({ text: 'FlareCloud Systems • Command Guide' });

    await message.reply({ embeds: [embed] });
  }
};
