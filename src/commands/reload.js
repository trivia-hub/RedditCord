import { MessageEmbed } from 'discord.js';

export const run = (client, msg) => {
  client.reloadCommands();
  const embed = new MessageEmbed()
    .setTitle(`Reloaded ${client.commands.size} commands!`);
  msg.channel.send(embed);
};

export const name = 'reload';
export const description = 'Reload all commands';
export const permissionLevel = 2;
export const alias = 're';
