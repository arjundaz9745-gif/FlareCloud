const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// ⚙️ CONFIG
const dataFilePath = path.resolve(__dirname, '..', 'data.json');
const VOUCH_CHANNEL_ID = '1556279907838074970';
const VOUCH_MENTION_TARGET_ID = '1428660662602563626';
const GENERATOR_CHANNEL_IDS = [
  '1555427957210619964', // free gen
  '1556279226129448971', // booster gen
  '1556279704875565206'  // vip gen
];
const VOUCH_FAILURE_LOG_CHANNEL_ID = '1556280037060124682';
const APPEAL_CHANNEL_ID = '1555427972008386590';

// ⚙️ SETTINGS
const COUNTDOWN_SECONDS = 300;
const GEN_BLOCK_MINUTES = 30;
const ALLOWED_ITEMS = ["mc_bedrock", "xbox", "minecraft", "steam", "ranked", "cape", "unbanned", "mcfa","crunchyroll"];

// 🧠 MEMORY + DATA STORAGE
let data = { permBlocks: {}, tempBlocks: {} };
const pending = {}; // For vouch waiting list

// 🗂 Load + Save system
function loadData() {
  try {
    const raw = fs.readFileSync(dataFilePath, 'utf8');
    data = JSON.parse(raw);
  } catch {
    data = { permBlocks: {}, tempBlocks: {} };
    saveData();
  }
}

function saveData() {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Failed to save data.json:', err);
  }
}
loadData();

// 🧩 REGEX SETUP
const itemGroup = ALLOWED_ITEMS.map(it => it.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
const VOUCH_REGEX = new RegExp(`^Legit\\s+got\\s+(${itemGroup})\\s+by\\s+<@!?(\\d+)>$`, 'i');
const GEN_REGEX = /^\$(free|premium|vip)\s*(.*)?$/i;
const VOUCH_ATTEMPT_REGEX = /^(vouch|legit|got).*/i;

// 🧰 HELPERS
function ensureGuild(gid) {
  if (!data.permBlocks[gid]) data.permBlocks[gid] = {};
  if (!data.tempBlocks[gid]) data.tempBlocks[gid] = {};
  if (!pending[gid]) pending[gid] = {};
}

function isValidVouch(content) {
  const m = VOUCH_REGEX.exec(content.trim());
  return m && m[2] === VOUCH_MENTION_TARGET_ID;
}

function isGenCommand(content) {
  return GEN_REGEX.test(content.trim());
}

// 🕒 Register vouch countdown
function registerMemberForVouch(guild, member, messageId, client, channelId) {
  ensureGuild(guild.id);
  const existing = pending[guild.id]?.[member.id];
  if (existing?.timeout) clearTimeout(existing.timeout);

  const registeredAt = new Date();
  const expiresAt = new Date(registeredAt.getTime() + COUNTDOWN_SECONDS * 1000);

  const timeout = setTimeout(() => {
    handleNoVouchBlock(guild, member, client).catch(console.error);
  }, COUNTDOWN_SECONDS * 1000);

  pending[guild.id][member.id] = { registeredAt, expiresAt, timeout };
  console.log(`\x1b[33m[VOUCH] ⏳ ${member.user.tag} must vouch by ${expiresAt.toLocaleTimeString()}\x1b[0m`);
}

// 🧾 Vouch Failure Embed (Modern Ban Embed)
async function sendVouchFailureNotification(client, member, reason, unblockTime) {
  const appealChannel = `<#${APPEAL_CHANNEL_ID}>`;
  const expiresAt = `<t:${Math.floor(unblockTime / 1000)}:R>`; // Discord relative timestamp

  const embed = new EmbedBuilder()
    .setColor(0x000000) // black
    .setTitle(`${e('bans')} User Temporarily Banned`)
    .setDescription(`${e('lock_key')} <@${member.id}> has been **temporarily banned** from using the generator bot.`)
    .addFields(
      { name: `${e('notepad')} Reason`, value: `> ${reason}`, inline: false },
      { name: `${e('timer')} Duration`, value: `> ${GEN_BLOCK_MINUTES} minutes`, inline: true },
      { name: `${e('timer')} Expires`, value: `> ${expiresAt}`, inline: true },
      { name: `${e('bans')} Banned By`, value: `> <@${VOUCH_MENTION_TARGET_ID}>`, inline: false },
      { name: `${e('notepad')} Think False Ban?`, value: `> Appeal here: ${appealChannel}`, inline: false }
    )
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setFooter({ text: `Requested by ${member.user.tag}`, iconURL: member.user.displayAvatarURL() })
    .setTimestamp();

  const logChan = await client.channels.fetch(VOUCH_FAILURE_LOG_CHANNEL_ID).catch(() => null);
  if (logChan) await logChan.send({ content: `<@${member.id}>`, embeds: [embed] }).catch(() => {});
  await member.send({ embeds: [embed] }).catch(() => {});
}

// 🚫 Temporary block user + Auto Unban Embed
async function blockUserFromGen(guild, member, reason, client) {
  ensureGuild(guild.id);
  if (data.tempBlocks[guild.id][member.id]) return;

  console.log(`\x1b[31m[GEN BLOCK] 🚫 ${member.user.tag} blocked for ${GEN_BLOCK_MINUTES}m\x1b[0m`);
  const unblockTime = Date.now() + GEN_BLOCK_MINUTES * 60 * 1000;

  await sendVouchFailureNotification(client, member, reason, unblockTime);

  const timeout = setTimeout(async () => {
    console.log(`\x1b[32m[GEN UNBLOCK] ✅ ${member.user.tag} unblocked after ${GEN_BLOCK_MINUTES}m\x1b[0m`);
    delete data.tempBlocks[guild.id][member.id];
    saveData();

    // ✅ Send unban embed automatically
    const unbanEmbed = new EmbedBuilder()
      .setColor(0x00ff80)
      .setTitle(`${e('unban')} User Unbanned (Ban Expired)`)
      .setDescription(`🎉 <@${member.id}> has been **Unbanned** from using the Generator.`)
      .addFields(
        { name: `${e('timer')} Ban Duration`, value: `> ${GEN_BLOCK_MINUTES} minutes`, inline: false },
        { name: `${e('notepad')} Appeal Info`, value: `> If you think this was false, you can open a ticket in <#${APPEAL_CHANNEL_ID}>`, inline: false }
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: 'FlareCloud Generator', iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    const logChan = await client.channels.fetch(VOUCH_FAILURE_LOG_CHANNEL_ID).catch(() => null);
    if (logChan) await logChan.send({ content: `<@${member.id}>`, embeds: [unbanEmbed] }).catch(() => {});
    await member.send({ embeds: [unbanEmbed] }).catch(() => {});
  }, GEN_BLOCK_MINUTES * 60 * 1000);

  data.tempBlocks[guild.id][member.id] = { unblockTime, timeout };
  saveData();
}

// ❌ Handle no vouch event
async function handleNoVouchBlock(guild, member, client) {
  const userPending = pending[guild.id]?.[member.id];
  if (!userPending) return;

  const vouchChan = guild.channels.cache.get(VOUCH_CHANNEL_ID);
  const msgs = await vouchChan?.messages.fetch({ limit: 50 }).catch(() => null);
  let vouched = false;

  if (msgs) {
    for (const [, msg] of msgs) {
      if (
        msg.author.id === member.id &&
        msg.createdTimestamp > userPending.registeredAt.getTime() &&
        isValidVouch(msg.content)
      ) {
        vouched = true;
        break;
      }
    }
  }

  if (!vouched) {
    await blockUserFromGen(guild, member, 'Did not vouch after generating an account', client);
  }

  delete pending[guild.id][member.id];
}

// 🚧 Block checking system
function isUserBlockedFromGen(guild, userId) {
  ensureGuild(guild.id);
  if (data.permBlocks[guild.id]?.[userId]) return true;

  const temp = data.tempBlocks[guild.id]?.[userId];
  if (temp && Date.now() <= temp.unblockTime) return true;

  if (temp && Date.now() > temp.unblockTime) {
    clearTimeout(temp.timeout);
    delete data.tempBlocks[guild.id][userId];
    saveData();
  }
  return false;
}

// 🔒 Manual Ban / Unban Commands
function permBanUser(guild, userId) {
  ensureGuild(guild.id);
  data.permBlocks[guild.id][userId] = true;
  saveData();
}

function permUnbanUser(guild, userId) {
  ensureGuild(guild.id);
  delete data.permBlocks[guild.id][userId];
  saveData();
}

function tempUnbanUser(guild, userId) {
  ensureGuild(guild.id);
  const temp = data.tempBlocks[guild.id]?.[userId];
  if (temp) {
    clearTimeout(temp.timeout);
    delete data.tempBlocks[guild.id][userId];
    saveData();
  }
}

// 💬 Message Handler (auto deletes invalid vouch)
async function handleMessage(message, client) {
  if (message.author.bot) return;
  const guild = message.guild;
  const member = message.member;
  ensureGuild(guild.id);

  if (message.channel.id === VOUCH_CHANNEL_ID) {
    const valid = isValidVouch(message.content);
    const looksLike = VOUCH_ATTEMPT_REGEX.test(message.content.trim());

    if (looksLike && !valid) {
      await message.delete().catch(() => {});
      const warn = await message.channel.send(
        `<@${message.author.id}> ${e('Wrong')} Invalid vouch.\nUse: \`Legit got <service> by <@${VOUCH_MENTION_TARGET_ID}>\``
      );
      setTimeout(() => warn.delete().catch(() => {}), 5000);
      console.log(`[VOUCH] ❌ Deleted invalid vouch from ${message.author.tag}`);
      return;
    }

    if (valid && pending[guild.id][message.author.id]) {
      clearTimeout(pending[guild.id][message.author.id].timeout);
      delete pending[guild.id][message.author.id];
      console.log(`\x1b[32m[VOUCH] ✅ ${message.author.tag} vouched successfully\x1b[0m`);
    }
  }
}

// ✅ EXPORT MODULE
module.exports = {
  name: 'vouch-system',
  handleMessage,
  registerMemberForVouch,
  handleNoVouchBlock,
  isUserBlockedFromGen,
  permBanUser,
  permUnbanUser,
  tempUnbanUser,
  tempBlocks: data.tempBlocks,
  permBlocks: data.permBlocks,
};
