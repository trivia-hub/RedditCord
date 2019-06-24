import Discord from 'discord.js';
import fs from 'fs';
import Enmap from 'enmap';

export default class Client extends Discord.Client {
  constructor(options) {
    super(options);
    if (!options.token) throw new Error('No token was provided.');
    if (!options.prefix) throw new Error('No prefix was provided.');
    if (!options.owners) throw new Error('No owner(s) were provided');
    this.commands = new Enmap();
    this.prefix = options.prefix;
    this.owners = options.owners;
    this.login(options.token);
    this.on('message', this.handleMessage.bind(this));
    this.on('ready', this.handleConnected.bind(this));
  }

  loadCommands() {
    fs.readdir(`${__dirname}/../commands`, (err, files) => {
      if (err) throw new Error(err);
      files.forEach((file) => {
        if (!file.endsWith('.js')) return;
        const props = require(`${__dirname}/../commands/${file}`);
        const commandName = file.split('.')[0];
        this.commands.set(commandName, props);
        this.emit('commandLoaded', commandName);
      });
    });
  }

  reloadCommands() {
    this.commands.array().forEach((cmd) => {
      delete require.cache[require.resolve(`${__dirname}/../commands/${cmd.name}`)];
      this.commands.set(cmd.name, require(`${__dirname}/../commands/${cmd.name}`));
      this.emit('commandReloaded', cmd.name);
    });
  }

  handleMessage(msg) {
    if (msg.author.bot) return;
    if (!msg.content.startsWith(this.prefix)) return;
    const args = msg.content.slice(this.prefix.length).trim().split(/ +/g);
    const commandName = args.shift().toLowerCase();
    const command = this.commands.find(c => c.name === commandName);
    if (!command.permissionLevel) command.permissionLevel = 0;
    if (command.permissionLevel === 2 && !this.owners.includes(msg.author)) return;
    if (command) command.run(this, msg, args);
  }

  handleConnected() {
    this.loadCommands();
  }
}
