const Discord = require('discord.js');

const client = new Discord.Client({
  intents: [
    Discord.Intents.FLAGS.GUILDS,
    Discord.Intents.FLAGS.GUILD_MESSAGES,
    Discord.Intents.FLAGS.GUILD_VOICE_STATES
  ]
});

const token = '';

const readyEvent = require('./events/ready');
client.on('ready', () => {
  readyEvent.execute(client);
});
client.on('debug', console.log);

client.login(token);
