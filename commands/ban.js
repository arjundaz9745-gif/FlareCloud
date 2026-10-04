const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'ban',
  description: 'Permanently block a user from generator commands',
  async execute(message, args, client) {
    // Check permissions
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.reply('You do not have permission to ban users.');
    }

    if (args.length === 0) {
      return message.reply('Usage: $ban @user');
    }

    const user = message.mentions.users.first();
    if (!user) {
      return message.reply('Please mention a valid user.');
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

    // Check if already perm banned
    if (vouchSystem.permBlocks[message.guild.id].has(user.id)) {
      return message.reply(`${user.tag} is already permanently banned.`);
    }

    // Add permanent block
    vouchSystem.permBlocks[message.guild.id].add(user.id);

    // Remove temp block if exists
    if (vouchSystem.tempBlocks[message.guild.id][user.id]) {
      clearTimeout(vouchSystem.tempBlocks[message.guild.id][user.id].timeout);
      delete vouchSystem.tempBlocks[message.guild.id][user.id];
    }

    const embed = new EmbedBuilder()
      .setTitle('🚫 User Permanently Banned')
      .setDescription(`**${user.tag}** is now permanently blocked from using generator commands.`)
      .addFields(
        { name: 'Banned By', value: `${message.author.tag}`, inline: true },
        { name: 'User ID', value: `${user.id}`, inline: true }
      )
      .setColor('Red')
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
    console.log(`\x1b[31m[PERM BAN] ${user.tag} permanently banned by ${message.author.tag}\x1b[0m`);
  }
};
