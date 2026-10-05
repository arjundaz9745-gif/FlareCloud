const { EmbedBuilder } = require("discord.js");

const FREE_GEN_ROLE_ID = "1555427829800239175";
const TARGET_STATUS = "Free G3n/Toolz at .gg/G4uywBjmgU";
const CHECK_INTERVAL = 5 * 60 * 1000;
const LOG_CHANNEL_ID = "1556280089715413012";

// Emoji names — resolved at runtime via client.resolveEmoji
const EMOJI_NAMES = {
  success: 'success',
  warning: 'error',
  status: 'status',
  offline: 'offline',
  tick: 'tick'
};

function statusMatches(state) {
  if (!state) return false;
  const s = String(state);
  const lower = s.toLowerCase();
  return (
    s.includes("Free G3n/Toolz at .gg/G4uywBjmgU") ||
    lower.includes("g4uywbjmgu") ||
    (lower.includes("free g3n") && lower.includes(".gg/"))
  );
}

function getCustomState(presence) {
  if (!presence || !presence.activities) return null;
  const custom = presence.activities.find((a) => a.type === 4);
  return custom?.state || null;
}

module.exports = {
  name: "cstatus",
  description: "Verify custom status and manage Free Gen role",

  async execute(message, args, client) {
        const e = (n, fb='') => (client.resolveEmoji ? client.resolveEmoji(message.guild, n, fb) : (fb || ''));
    const emojis = {
      success: e('success'),
      warning: e('error'),
      status: e('status'),
      offline: e('offline'),
      tick: e('tick')
    };

    const role = message.guild.roles.cache.get(FREE_GEN_ROLE_ID);
    if (!role) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setTitle(`${emojis.warning} Role Not Found`)
            .setDescription("Freemium role ID is wrong or role was deleted.")
        ]
      });
    }

    // Fetch member with presence when possible
    let member = message.member;
    try {
      member = await message.guild.members.fetch({
        user: message.author.id,
        withPresences: true
      });
    } catch {
      member = await message.guild.members.fetch(message.author.id).catch(() => null);
    }
    if (!member) return message.reply("Member not found.");

    const presence = member.presence;
    const state = getCustomState(presence);

    // No presence data (intent off, or Discord hid it) — do NOT treat as offline fail
    if (!presence) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Orange")
            .setTitle(`${emojis.status} Can't read your status`)
            .setDescription(
              "Bot couldn't see your presence.\n\n" +
                "**1.** Enable **Presence Intent** in Discord Developer Portal → Bot\n" +
                "**2.** Set status to **Online** (not Invisible)\n" +
                "**3.** Set custom status exactly to:\n" +
                `\`\`\`\n${TARGET_STATUS}\n\`\`\`\n` +
                "Then run `$cstatus` again."
            )
        ]
      });
    }

    const hasStatus = statusMatches(state);

    if (hasStatus) {
      if (!member.roles.cache.has(FREE_GEN_ROLE_ID)) {
        await member.roles.add(role).catch(() => {});
      }
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Green")
            .setTitle(`${emojis.tick} Verified — Official FlareCloud`)
            .setDescription(
              `Your custom status matches.\n\`\`\`\n${TARGET_STATUS}\n\`\`\`\nFreemium role granted. Don't remove the status or the role will be removed.`
            )
        ]
      });
    }

    // Status wrong or empty — remove role only if we actually read activities
    if (member.roles.cache.has(FREE_GEN_ROLE_ID)) {
      await member.roles.remove(role).catch(() => {});
    }
    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("Red")
          .setTitle(`${emojis.warning} Verification Failed`)
          .setDescription(
            `Set your **custom status** to:\n\`\`\`\n${TARGET_STATUS}\n\`\`\`\n` +
              `Current status seen: \`${state || "none"}\`\n` +
              `Stay **Online** (not Invisible), then run \`$cstatus\` again.`
          )
      ]
    });
  },

  async startAutoCheck(client) {
    const e = (n) => (client.resolveEmoji ? client.resolveEmoji(client.guilds.cache.first(), n, '') : '');
    const emojis = {
      success: e('success'),
      warning: e('error'),
      status: e('status'),
      offline: e('offline'),
      tick: e('tick')
    };

    const guild = client.guilds.cache.first();
    if (!guild) return;

    console.log("Auto status checker every 5 minutes...");
    let busy = false;

    setInterval(async () => {
      if (busy) return;
      busy = true;
      try {
        try {
          await guild.members.fetch({ withPresences: true });
        } catch (err) {
          console.warn("presence fetch:", err.message);
        }

        const role = guild.roles.cache.get(FREE_GEN_ROLE_ID);
        const logChannel = guild.channels.cache.get(LOG_CHANNEL_ID);
        if (!role) {
          busy = false;
          return;
        }

        for (const member of guild.members.cache.values()) {
          if (member.user.bot) continue;
          // Skip if we have no presence at all (don't mass-remove)
          if (!member.presence) continue;

          const state = getCustomState(member.presence);
          const hasStatus = statusMatches(state);

          try {
            if (hasStatus && !member.roles.cache.has(FREE_GEN_ROLE_ID)) {
              await member.roles.add(role).catch(() => {});
              logChannel
                ?.send(`${emojis.success} **${member.user.tag}** got Freemium (status OK).`)
                .catch(() => {});
            }
            if (!hasStatus && state !== null && member.roles.cache.has(FREE_GEN_ROLE_ID)) {
              // only remove if we saw a real custom status that doesn't match
              // if activities empty but online, still remove
              const acts = member.presence.activities || [];
              if (acts.length === 0 || !hasStatus) {
                await member.roles.remove(role).catch(() => {});
                logChannel
                  ?.send(`${emojis.warning} **${member.user.tag}** lost Freemium (status changed).`)
                  .catch(() => {});
              }
            }
          } catch (err) {
            console.error(member.user.tag, err.message);
          }
        }
      } catch (err) {
        console.error("AutoCheck:", err);
      } finally {
        busy = false;
      }
    }, CHECK_INTERVAL);
  }
};
