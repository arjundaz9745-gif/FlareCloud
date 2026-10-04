const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'unban',
  description: 'Unblock a user from generator commands',
  async execute(message, args, client) {
    // Check permissions
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.reply('You do not have permission to unban users.');
    }

    if (args.length === 0) {
      return message.reply('Usage: $unban @user');
    }

    const user = message.mentions.users.first();
    if (!user) {
      return message.reply('Please mention a valid user.');
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

    let wasPermBanned = false;
    let wasTempBanned = false;

    // Remove perm block
    if (vouchSystem.permBlocks[message.guild.id].has(user.id)) {
      vouchSystem.permBlocks[message.guild.id].delete(user.id);
      wasPermBanned = true;
    }

    // Remove temp block
    if (vouchSystem.tempBlocks[message.guild.id][user.id]) {
      clearTimeout(vouchSystem.tempBlocks[message.guild.id][user.id].timeout);
      delete vouchSystem.tempBlocks[message.guild.id][user.id];
      wasTempBanned = true;
    }

    if (!wasPermBanned && !wasTempBanned) {
      return message.reply(`${user.tag} is not currently banned.`);
    }

    let banType = '';
    if (wasPermBanned) banType += 'Permanent ban';
    if (wasTempBanned) {
      if (banType) banType += ' and Temporary ban';
      else banType = 'Temporary ban';
    }

    const embed = new EmbedBuilder()
      .setTitle('✅ User Unblocked')
      .setDescription(`**${user.tag}** can now use generator commands again.`)
      .addFields(
        { name: 'Unbanned By', value: `${message.author.tag}`, inline: true },
        { name: 'Ban Type Removed', value: `${banType}`, inline: true }
      )
      .setColor('Green')
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
    console.log(`\x1b[32m[UNBAN] ${user.tag} unbanned by ${message.author.tag}\x1b[0m`);
  }
};
