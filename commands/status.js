const { EmbedBuilder } = require("discord.js");

// ==== CHANGE THESE VALUES ====
const FREE_GEN_ROLE_ID = "1555427829800239175";
const TARGET_STATUS = ".gg/S9cffQjq9 : Official FlareCloud";
const CHECK_INTERVAL = 5 * 60 * 1000; // every 5 minutes to avoid rate limits
const LOG_CHANNEL_ID = "1556280089715413012"; // log channel

const emojis = {
  success: "<a:success:1428670642538152058>",
  warning: "<a:error:1428669202608164864>",
  status: "<:status:1428735609622757448>",
  offline: "<a:offline:1428735983272333402>"
};

module.exports = {
  name: "cstatus",
  description: "Verify custom status and manage Free Gen role (manual + auto)",

  async execute(message, args, client) {
    const role = message.guild.roles.cache.get(FREE_GEN_ROLE_ID);
    if (!role)
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setTitle(`${emojis.warning} Role Not Found`)
            .setDescription("Please check the Free Gen role ID.")
        ]
      });

    const member = await message.guild.members
      .fetch(message.author.id)
      .catch(() => null);
    if (!member)
      return message.reply("❌ Member not found or left the server.");

    const presence = member.presence;
    if (!presence || !presence.activities.length) {
      if (member.roles.cache.has(FREE_GEN_ROLE_ID))
        await member.roles.remove(role).catch(() => {});
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setTitle(`${emojis.offline} Verification Failed`)
            .setDescription(
              `You are **offline** or **invisible**. The Free Gen role has been removed.`
            )
        ]
      });
    }

    const custom = presence.activities.find(a => a.type === 4);
    const hasStatus = custom?.state?.includes(TARGET_STATUS);

    if (hasStatus) {
      if (!member.roles.cache.has(FREE_GEN_ROLE_ID))
        await member.roles.add(role).catch(() => {});
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Green")
            .setTitle(`<a:hearts_blue:1447650186691350538> Thank You For Supporting!`)
            .setDescription(
              `<a:tick:1428738634118598706> Your custom status matches:\n\`\`\`${TARGET_STATUS}\`\`\``
            )
            .setFooter({
              text: `Don't Change Your Status, otherwise Role will be Removed!`
            })
        ]
      });
    } else {
      if (member.roles.cache.has(FREE_GEN_ROLE_ID))
        await member.roles.remove(role).catch(() => {});
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setTitle(`${emojis.warning} Invalid Status`)
            .setDescription(
              `❗ Set your custom status to:\n\`\`\`${TARGET_STATUS}\`\`\``
            )
        ]
      });
    }
  },

  async startAutoCheck(client) {
    const guild = client.guilds.cache.first();
    if (!guild) return console.log("❌ No guild found for auto-check.");

    console.log("🔁 Auto status checker running every 2 minutes...");
    let isChecking = false;

    setInterval(async () => {
      if (isChecking) return;
      isChecking = true;

      try {
        try {
          await guild.members.fetch({ withPresences: true });
        } catch (err) {
          if (err.code === "GuildMembersTimeout") {
            console.warn("⚠️ Timeout fetching members, using cache...");
          } else if (err.message?.includes("rate limit") || err.name === "GatewayRateLimitError") {
            console.warn("⚠️ Rate limited, skipping this check cycle...");
            isChecking = false;
            return;
          } else {
            console.warn("⚠️ Member fetch issue, using cache:", err.message);
          }
        }

        const role = guild.roles.cache.get(FREE_GEN_ROLE_ID);
        const logChannel = guild.channels.cache.get(LOG_CHANNEL_ID);

        if (!role) {
          console.log("⚠️ Free Gen role not found.");
          isChecking = false;
          return;
        }
        if (!logChannel) console.log("⚠️ Log channel not found.");

        guild.members.cache.forEach(async member => {
          if (member.user.bot) return;

          const presence = member.presence;
          const custom = presence?.activities?.find(a => a.type === 4);
          const hasStatus = custom?.state?.includes(TARGET_STATUS);

          try {
            if (hasStatus && !member.roles.cache.has(FREE_GEN_ROLE_ID)) {
              await member.roles.add(role).catch(() => {});
              logChannel?.send(
                `${emojis.success} **${member.user.tag}** got Free Gen role (status matched).`
              );
            }

            if (!hasStatus && member.roles.cache.has(FREE_GEN_ROLE_ID)) {
              await member.roles.remove(role).catch(() => {});
              logChannel?.send(
                `${emojis.warning} **${member.user.tag}** lost Free Gen role (status removed/offline).`
              );
            }
          } catch (e) {
            console.error(`⚠️ Role update failed for ${member.user.tag}:`, e.message);
          }
        });
      } catch (err) {
        console.error("AutoCheck loop error:", err);
      } finally {
        isChecking = false;
      }
    }, CHECK_INTERVAL);
  }
};
