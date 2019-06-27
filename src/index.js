import chalk from 'chalk';
import { MessageEmbed } from 'discord.js';
import Client from './Classes/Discord';
import MongoClient from './Classes/Mongo';
import WebServer from './Classes/WebServer';
import Reddit from './Classes/Reddit';
import {
  token, owners, mongo, webserver,
} from '../config';

const client = new Client({
  token,
  owners,
  prefix: '+',
  disabledEvents: ['TYPING_START'],
  disableEveryone: true,
});

const Mongo = new MongoClient(mongo);
Mongo.connect();
Mongo.on('connected', async () => {
  console.log(`${chalk.blue('INFO')} Connected to MongoDB!`);
  const api = new WebServer(webserver.port, Mongo);
  api.on('ready', () => console.log(`${chalk.blue('INFO')} WebServer running on port ${api.port}`));
  client.db = Mongo;
  client.webserver = api;
  const users = await Mongo.db.collection('users').find({}).toArray();
  users.forEach((u) => {
    if (u.refreshToken) {
      const reddit = new Reddit(u.refreshToken);
      reddit.on('message', (msgs) => {
        const message = msgs[0];
        const embed = new MessageEmbed()
          .setTitle(':mailbox_with_mail: New Message')
          .addField('Author', `u/${message.author}`)
          .addField('Type', message.subject)
          .addField('Title', message.link_title)
          .addField('Content', message.body)
          .setTimestamp(Date.now());
        if (message.context) embed.setURL(`https://reddit.com${message.context}`);
        const user = client.users.get(u.id);
        if (user) user.send(embed);
      });
      reddit.on('invalidToken', async () => {
        const user = u;
        user.refreshToken = null;
        user.oauth = null;
        await Mongo.updateUser(u.id, user);
      });
    }
  });
});

client.on('commandLoaded', c => console.log(`${chalk.blue('INFO')} Loaded Command ${chalk.bold(`${c}`)}!`));
client.on('commandReloaded', c => console.log(`${chalk.blue('INFO')} Reloaded Command ${chalk.bold(`${c}`)}!`));
client.on('ready', () => console.log(`${chalk.blue('INFO')} Logged in as ${chalk.bold(client.user.tag)}!`));
