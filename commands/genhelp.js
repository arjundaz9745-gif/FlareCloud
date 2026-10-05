const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'genhelp',
  aliases: ['access', 'tutorial', 'guide'],
  description: 'Full Free / Booster / Premium gen access guide',
  async execute(message, args, client) {
    const e = (n, fb = '') =>
      (client.resolveEmoji && message.guild)
        ? client.resolveEmoji(message.guild, n, fb)
        : fb;

    const hashtag = e('hashtag', '＃');
    const verified = e('verified', '✅');
    const arrow = e('arrow_1', '»');

    const freeCh = '<#1555427957210619964>';
    const cmdCh = '<#1555427972008386590>';
    const boostCh = '<#1556279226129448971>';
    const premCh = '<#1556279704875565206>';
    const seller = '<@1398979148063571989>';

    // Exact status users must set
    const STATUS = 'Free G3n/Toolz at .gg/G4uywBjmgU';

    const embed = new EmbedBuilder()
      .setTitle(`${hashtag} ACCESS GUIDE`)
      .setColor(0x0d1117)
      .setDescription(
        [
          `${arrow} **FREE G3N**`,
          `${verified} To get access, put this in your Discord **custom status**:`,
          '',
          `\`\`\`\n${STATUS}\n\`\`\``,
          '',
          `${arrow} Then go to ${cmdCh} and run:`,
          '',
          '```\n-cstatus\n```',
          '',
          `${verified} Once verified, you will receive the free-gen role and can use **Free G3n**.`,
          `${verified} Keep that status on. If you remove it, access can be removed automatically.`,
          '',
          `${arrow} **How to use Free G3n**`,
          `${verified} Open ${freeCh}`,
          `${verified} Run \`-fgen <service>\` (example: \`-fgen minecraft\`)`,
          `${verified} Check stock first with \`-stock\``,
          '',
          '────────────────────',
          '',
          `${arrow} **BOOSTER G3N**`,
          `${verified} Boost this server to unlock **Booster G3n**.`,
          `${verified} After boosting, go to ${boostCh}`,
          `${verified} Run \`-bgen <service>\` to generate a booster-tier account.`,
          '',
          '────────────────────',
          '',
          `${arrow} **PREMIUM G3N**`,
          `${verified} Want **Premium G3n**?`,
          `${verified} Price: **$5**`,
          `${verified} DM ${seller} to purchase access.`,
          `${verified} After payment is confirmed, you get the premium role and can use ${premCh}`,
          `${verified} Command: \`-pgen <service>\``,
          '',
          '────────────────────',
          '',
          `${hashtag} **G3N CHANNELS**`,
          `${arrow} Free G3n: ${freeCh}`,
          `${arrow} Booster G3n: ${boostCh}`,
          `${arrow} Premium G3n: ${premCh}`,
          '',
          `${hashtag} **QUICK COMMANDS**`,
          `${arrow} \`-fgen <service>\` — Free tier account`,
          `${arrow} \`-bgen <service>\` — Booster tier account`,
          `${arrow} \`-pgen <service>\` — Premium tier account`,
          `${arrow} \`-stock\` — View all stock`,
          `${arrow} \`-cstatus\` — Verify free status & get role`,
          `${arrow} \`-access\` — Show this guide again`,
          '',
          `${verified} **Rules**`,
          `${arrow} Always vouch after generating when asked`,
          `${arrow} Do not share accounts publicly`,
          `${arrow} Use the correct channel for each tier`,
          `${arrow} Wrong channel = command will be rejected`
        ].join('\n')
      )
      .setFooter({
        text: 'FlareCloud • Access Guide • Done reading? Use -cstatus then -fgen'
      });

    await message.reply({ embeds: [embed] });
  }
};
