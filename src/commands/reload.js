import { MessageEmbed } from 'discord.js';

export const run = (client, msg) => {
  client.reloadCommands();
  const embed = new MessageEmbed()
    .setTitle(`Reloaded ${client.commands.size} commands!`);
  msg.channel.send(embed);
};

export const name = 'reload';
