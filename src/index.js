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
  users.forEach(async (u) => {
    await Mongo.initUser(u.id);
    const user = await Mongo.getUser(u.id);
    if (user.refreshToken) {
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
        const author = client.users.get(u.id);
        if (author) author.send(embed);
      });
      reddit.on('invalidToken', async () => {
        const newUser = user;
        newUser.refreshToken = null;
        newUser.oauth = null;
        await Mongo.updateUser(u.id, newUser);
      });
    }
  });
});

client.on('commandLoaded', c => console.log(`${chalk.blue('INFO')} Loaded Command ${chalk.bold(`${c}`)}!`));
client.on('commandReloaded', c => console.log(`${chalk.blue('INFO')} Reloaded Command ${chalk.bold(`${c}`)}!`));
client.on('ready', () => console.log(`${chalk.blue('INFO')} Logged in as ${chalk.bold(client.user.tag)}!`));
