
// Fake web server so Render free Web Service stays alive
const http = require('http');
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('FlareCloud bot online');
}).listen(PORT, '0.0.0.0', () => console.log('Fake web on port', PORT));

const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  Events,
  REST,
  Routes
} = require('discord.js');
const fs = require('fs-extra');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences // required for status tracking
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember, Partials.User]
});

// ==== EMOJI RESOLVER (by name, works with custom/animated server emojis) ====
function resolveEmoji(guild, name, fallback = '') {
  if (!name) return fallback || '';
  const m = String(name).match(/^<a?:([A-Za-z0-9_]+):\d+>$/);
  const emojiName = m ? m[1] : String(name);
  const lower = emojiName.toLowerCase();

  const findIn = (cache) => {
    if (!cache) return null;
    return (
      cache.find(e => e.name === emojiName) ||
      cache.find(e => e.name.toLowerCase() === lower) ||
      null
    );
  };

  // 1) This guild
  let emoji = guild && guild.emojis ? findIn(guild.emojis.cache) : null;
  // 2) All emojis the bot can see (every mutual server)
  if (!emoji && client.emojis && client.emojis.cache) {
    emoji = findIn(client.emojis.cache);
  }
  if (emoji) return emoji.toString();

  // 3) config.json fallback (only if not YOUR_ID)
  try {
    if (typeof config !== 'undefined' && config.emojis && config.emojis[emojiName]) {
      const val = config.emojis[emojiName];
      if (val && !String(val).includes('YOUR_ID')) {
        const m2 = String(val).match(/^<a?:([A-Za-z0-9_]+):\d+>$/);
        if (m2) {
          const e2 = findIn(client.emojis && client.emojis.cache) ||
            (guild && guild.emojis && findIn(guild.emojis.cache));
          // try by extracted name
          const byName = findIn(client.emojis && client.emojis.cache);
          const fromName = client.emojis.cache.find(e => e.name.toLowerCase() === m2[1].toLowerCase());
          if (fromName) return fromName.toString();
        }
        return val;
      }
    }
  } catch (_) {}

  return fallback || '';
}

client.resolveEmoji = resolveEmoji;
// Shorthand: client.e(guild, 'Wrong')
client.e = (guild, name, fallback = '') => resolveEmoji(guild, name, fallback);



// ==== CONFIG ====
const configData = require('./config.json');
const config = {
  genChannelId: '1555427957210619964',
  boosterChannelId: '1556279226129448971',
  vipChannelId: '1556279704875565206',
  vouchChannelId: '1556279907838074970',
  logsChannelId: '1556280089715413012',
  genBansChannelId: '1556280037060124682',
  restockChannelId: '1556280198045900820',
  emojis: configData.emojis,

  statusText: "Free G3n/Toolz at .gg/G4uywBjmgU",
  statusRoleId: "1555427829800239175",
  premiumRoleId: "1556280665140363274",
  freemiumRoleId: "1555427829800239175",
  premiumSellerId: "1398979148063571989",
  premiumPrice: "$5",

  services: {
    "mcnfa": {
      stockFile: "stock/Mcnfa.txt",
      emoji: "s_yellow",
      display: "Mcnfa",
      vault: "free"
    },
    "xbox": {
      stockFile: "stock/Xbox.txt",
      emoji: "s_yellow",
      display: "Xbox",
      vault: "free"
    },
    "steam": {
      stockFile: "stock/Steam.txt",
      emoji: "s_yellow",
      display: "Steam",
      vault: "free"
    },
    "crunchyroll": {
      stockFile: "stock/CrunchyRoll.txt",
      emoji: "s_yellow",
      display: "CrunchyRoll",
      vault: "free"
    },
    "xboxcode": {
      stockFile: "stock/Xbox_Code.txt",
      emoji: "s_yellow",
      display: "Xbox Code",
      vault: "free"
    },
    "xbox_code": {
      stockFile: "stock/Xbox_Code.txt",
      emoji: "s_yellow",
      display: "Xbox Code",
      vault: "free"
    },
    "netflix": {
      stockFile: "stock/Netflix.txt",
      emoji: "s_yellow",
      display: "Netflix",
      vault: "free"
    },
    "mcsfa": {
      stockFile: "bosststock/Mcsfa.txt",
      emoji: "purple_1",
      display: "Mcsfa",
      vault: "booster"
    },
    "donut": {
      stockFile: "bosststock/Donut.txt",
      emoji: "purple_1",
      display: "Donut",
      vault: "booster"
    },
    "hypixel": {
      stockFile: "bosststock/Hypixel.txt",
      emoji: "purple_1",
      display: "Hypixel",
      vault: "booster"
    }
  },

  // PREMIUM / VIP vault ($pgen / $vip)
  vipServices: {
    "mcfa": {
      stockFile: "paidstock/mcfa.txt",
      emoji: "paid",
      display: "MCFA",
      vault: "premium"
    },
    "sfa": {
      stockFile: "paidstock/sfa.txt",
      emoji: "paid",
      display: "SFA",
      vault: "premium"
    },
    "nfa": {
      stockFile: "paidstock/nfa.txt",
      emoji: "paid",
      display: "NFA",
      vault: "premium"
    },
    "netflix": {
      stockFile: "paidstock/netflix.txt",
      emoji: "paid",
      display: "Netflix",
      vault: "premium"
    },
    "codez": {
      stockFile: "paidstock/codez.txt",
      emoji: "paid",
      display: "Codez",
      vault: "premium"
    },
    "codes": {
      stockFile: "paidstock/codez.txt",
      emoji: "paid",
      display: "Codez",
      vault: "premium"
    }
  }
};

client.config = config;

// ==== STOCK SYSTEM ====
const STOCK_PATHS = {
  "Freemium Vault": {
    "Mc_Bedrock": "freestock/Mc_Bedrock.txt",
    "Xbox": "freestock/Xbox.txt",
    "Minecraft": "freestock/Minecraft.txt",
    "Steam": "freestock/Steam.txt"
  },
  "Booster Vault": {
    "Ranked": "bosststock/Ranked.txt",
    "Cape": "bosststock/Cape.txt",
    "Unbanned": "bosststock/Unbanned.txt"
  },
  "Premium Vault": {
    "Mcfa": "paidstock/mcfa.txt",
    "Sfa": "paidstock/sfa.txt",
    "Nfa": "paidstock/nfa.txt",
    "Netflix": "paidstock/netflix.txt",
    "Codez": "paidstock/codez.txt"
  }
};

// ==== COMMAND LOADER ====
const commands = new Map();
const commandsDir = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsDir).filter(file =>
  file.endsWith('.js') &&
  file !== 'index.js' &&
  !file.startsWith('_')
);

let vouchSystem = null;
for (const file of commandFiles) {
  try {
    const command = require(path.join(commandsDir, file));
    if (file === 'vouch.js') {
      vouchSystem = command;
    } else if (command && command.name) {
      commands.set(command.name, command);
      // aliases
      const aliases = command.aliases || [];
      if (command.name === 'fgen') aliases.push('free');
      if (command.name === 'bgen') aliases.push('bosst', 'boost');
      if (command.name === 'pgen') aliases.push('vip');
      if (command.name === 'genhelp') aliases.push('access', 'tutorial', 'guide');
      for (const a of aliases) commands.set(a, command);
      console.log(`✅ Loaded command: $${command.name} (${file})`);
    } else {
      console.log(`⚠️ Skipped ${file} (no command.name)`);
    }
  } catch (err) {
    console.error(`❌ Failed to load commands/${file}:`, err.message);
  }
}

// ==== LOG COMMAND USAGE ====
async function logCommandUsage(message, commandName, args) {
  const logsChannel = message.guild?.channels.cache.get(config.logsChannelId);
  if (!logsChannel) return;

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('📝 Command Executed')
    .addFields(
      { name: 'Command', value: `\`$${commandName}\``, inline: true },
      { name: 'User', value: `${message.author.tag}`, inline: true },
      { name: 'Channel', value: `<#${message.channel.id}>`, inline: true },
      { name: 'Arguments', value: args.length > 0 ? `\`${args.join(' ')}\`` : 'None', inline: false }
    )
    .setTimestamp();

  await logsChannel.send({ embeds: [embed] }).catch(() => {});
}

// ==== MESSAGE HANDLER ====
client.on('messageCreate', async (message) => {
  try {
    if (vouchSystem) {
      try {
        await vouchSystem.handleMessage(message, client);
      } catch (vouchErr) {
        console.error('[VOUCH] handleMessage error:', vouchErr.message);
      }
    }
  } catch (_) {}

  if (message.author.bot) return;
  if (!message.guild) return; // ignore DMs for prefix commands

  const raw = (message.content || '').trim();
  if (!raw) return;

  let prefix = null;
  if (raw.startsWith('-')) prefix = '-';
  else if (raw.startsWith('$')) prefix = '$';
  else return;

  const args = raw.slice(prefix.length).trim().split(/\s+/).filter(Boolean);
  const commandName = (args.shift() || '').toLowerCase();
  if (!commandName) return;

  const command = commands.get(commandName);
  console.log(`[CMD] ${message.author.tag}: ${prefix}${commandName}`, 'args=', args);

  if (!command) {
    console.log(`[CMD] Unknown: ${prefix}${commandName} | loaded: ${[...commands.keys()].join(', ')}`);
    return;
  }

  try {
    await command.execute(message, args, client);
    await logCommandUsage(message, commandName, args);
  } catch (error) {
    console.error(`[CMD] ${prefix}${commandName} error:`, error);
    await message.reply(`❌ Error: ${error.message || error}`).catch(() => {});
  }
});

// ==== AUTO STATUS ROLE SYSTEM ====
client.on('presenceUpdate', async (oldPresence, newPresence) => {
  if (!newPresence || !newPresence.member) return;
  const member = newPresence.member;
  if (member.user.bot) return;

  const customStatus = newPresence.activities?.find(a => a.type === 4);
  const hasTargetStatus =
    customStatus && customStatus.state && customStatus.state.includes(config.statusText);

  const role = member.guild.roles.cache.get(config.statusRoleId);
  const logChannel = member.guild.channels.cache.get(config.logsChannelId);

  if (!role) return;

  try {
    if (hasTargetStatus && !member.roles.cache.has(role.id)) {
      await member.roles.add(role);
      console.log(`✅ Added role to ${member.user.tag}`);
      logChannel?.send(`✅ **${member.user.tag}** set correct status → role added`);
    } else if (!hasTargetStatus && member.roles.cache.has(role.id)) {
      await member.roles.remove(role);
      console.log(`❌ Removed role from ${member.user.tag}`);
      logChannel?.send(`❌ **${member.user.tag}** removed/changed status → role removed`);
    }
  } catch (err) {
    console.error(`⚠️ Role update failed for ${member.user.tag}:`, err.message);
  }
});

client.once(Events.ClientReady, async () => {
  console.log(`✅ Bot is ready! Logged in as ${client.user.tag}`);
  console.log(`📋 Commands loaded: ${[...commands.keys()].map(c => '$' + c).join(', ')}`);
  console.log(`😀 Emojis visible to bot: ${client.emojis.cache.size}`);
  for (const [, g] of client.guilds.cache) {
    console.log(`   Guild ${g.name}: ${g.emojis.cache.size} emojis`);
  }



  // === BOT WATCHING STATUS ===
  client.user.setActivity('.gg/dSm3FHqNJ', {
    type: 3 // WATCHING
  });

  if (vouchSystem && vouchSystem.slashCommands) {
    try {
      const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
      await rest.put(Routes.applicationCommands(client.user.id), {
        body: vouchSystem.slashCommands
      });
      console.log('✅ [Vouch] Slash commands registered');
    } catch (err) {
      console.error('❌ [Vouch] Slash registration failed:', err);
    }
  }

  const cstatus = require('./commands/status.js');
  if (cstatus.startAutoCheck) {
    cstatus.startAutoCheck(client);
    console.log('🟢 Auto status checker started!');
  }
});


const TOKEN = process.env.DISCORD_TOKEN;
if (!TOKEN) {
  console.error('Missing DISCORD_TOKEN env');
  process.exit(1);
}
client.login(TOKEN);

