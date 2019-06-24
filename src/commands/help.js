import { MessageEmbed } from 'discord.js';

export const run = (client, msg, args) => {
  if (!args.length) {
    const commands = client.commands.array().map(c => c.name);
    const embed = new MessageEmbed()
      .setTitle('Help :question:')
      .addField('Commands', commands.join(', '))
      .setFooter('Use +help [command] for specific command help.');
    msg.channel.send(embed);
  } else {
    const command = client.commands.find(c => c.name === args[0]);
    if (!command) {
      const embed = new MessageEmbed()
        .setTitle(`No command with the name "${args[0]}" was found.`);
      msg.channel.send(embed);
    } else {
      const embed = new MessageEmbed()
        .addField(`**Command Name:** ${command.name}`, '[]()')
        .addField(`**Command Description:** ${command.description}`, '[]()');
      if (command.args) {
        if (command.args.find(a => a.optional)) {
          embed.addField('**Optional Arguments:**', command.args.filter(a => a.optional).map(a => a.name));
        } else if (command.args.find(a => a.optional)) {
          embed.addField('**Required Arguments:**', command.args.filter(a => !a.optional).map(a => a.name));
        }
      }
      msg.channel.send(embed);
    }
  }
};

export const name = 'help';
export const description = 'Get command help';
export const args = [{ name: 'command', optional: true }];
