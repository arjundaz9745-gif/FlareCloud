const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'tempban',
  description: 'Temporarily block a user from generator commands',
  async execute(message, args, client) {
    // Check permissions
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.reply('You do not have permission to ban users.');
    }

    if (args.length < 2) {
      return message.reply('Usage: $tempban @user [minutes]');
    }

    const user = message.mentions.users.first();
    const minutes = parseInt(args[1], 10);

    if (!user) {
      return message.reply('Please mention a valid user.');
    }

    if (isNaN(minutes) || minutes <= 0) {
      return message.reply('Please provide a valid number of minutes (must be greater than 0).');
    }

    if (user.id === message.author.id) {
      return message.reply('You cannot ban yourself.');
    }

    // Get or create vouchSystem module
    const vouchSystem = require('./vouch.js');

    // Initialize guild data if not exists
    if (!vouchSystem.permBlocks) {
      vouchSystem.permBlocks = {};
    }
    if (!vouchSystem.permBlocks[message.guild.id]) {
      vouchSystem.permBlocks[message.guild.id] = new Set();
    }
    if (!vouchSystem.tempBlocks) {
      vouchSystem.tempBlocks = {};
    }
    if (!vouchSystem.tempBlocks[message.guild.id]) {
      vouchSystem.tempBlocks[message.guild.id] = {};
    }

    // Check if perm banned
    if (vouchSystem.permBlocks[message.guild.id].has(user.id)) {
      return message.reply(`${user.tag} is permanently banned. Use $unban to remove the permanent ban first.`);
    }

    // Clear existing temp ban
    if (vouchSystem.tempBlocks[message.guild.id][user.id]) {
      clearTimeout(vouchSystem.tempBlocks[message.guild.id][user.id].timeout);
    }

    const unblockTime = Date.now() + minutes * 60 * 1000;

    // Schedule unblock
    const timeout = setTimeout(() => {
      delete vouchSystem.tempBlocks[message.guild.id][user.id];
      console.log(`\x1b[32m[TEMP UNBAN] ${user.tag} automatically unbanned after ${minutes}m\x1b[0m`);
    }, minutes * 60 * 1000);

    vouchSystem.tempBlocks[message.guild.id][user.id] = { unblockTime, timeout };

    const embed = new EmbedBuilder()
      .setTitle('⏱️ User Temporarily Banned')
      .setDescription(`**${user.tag}** is blocked from using generator commands for **${minutes} minutes**.`)
      .addFields(
        { name: 'Banned By', value: `${message.author.tag}`, inline: true },
        { name: 'Duration', value: `${minutes} minutes`, inline: true },
        { name: 'Expires At', value: `<t:${Math.floor(unblockTime / 1000)}:F>`, inline: false }
      )
      .setColor('Orange')
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
    console.log(`\x1b[33m[TEMP BAN] ${user.tag} temporarily banned for ${minutes}m by ${message.author.tag}\x1b[0m`);
  }
};
