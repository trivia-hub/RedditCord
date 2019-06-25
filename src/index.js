import chalk from 'chalk';
import Client from './Classes/Discord';
import MongoClient from './Classes/Mongo';
import WebServer from './Classes/WebServer';
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
Mongo.on('connected', () => {
  console.log(`${chalk.blue('INFO')} Connected to MongoDB!`);
  const api = new WebServer(webserver.port, Mongo);
  api.on('ready', () => console.log(`${chalk.blue('INFO')} WebServer running on port ${api.port}`));
  client.db = Mongo;
  client.webserver = api;
});

client.on('commandLoaded', c => console.log(`${chalk.blue('INFO')} Loaded Command ${chalk.bold(`${c}`)}!`));
client.on('ready', () => console.log(`${chalk.blue('INFO')} Logged in as ${chalk.bold(client.user.tag)}!`));
