import chalk from 'chalk';
import Client from './Classes/Discord';
import { token, owners } from '../config';

const client = new Client({
  token,
  owners,
  prefix: '+',
  disabledEvents: ['TYPING_START'],
  disableEveryone: true,
});

client.on('commandLoaded', c => console.log(`${chalk.blue('INFO')} Loaded Command ${chalk.bold(`${c}`)}!`));
client.on('ready', () => console.log(`${chalk.blue('INFO')} Logged in as ${chalk.bold(client.user.tag)}!`));
