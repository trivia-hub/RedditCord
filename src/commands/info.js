import { MessageEmbed } from 'discord.js';

export const run = (client, msg) => {
  const embed = new MessageEmbed()
    .setTitle('Info')
    .setDescription('RedditCord is an opensource Discord Reddit Client created by vilP1l#0001, SpotiKona#0001 and its a-me markio#9733 created for Discord Hack Week.')
    .addField('Github', 'https://github.com/trivia-hub/RedditCord')
    .setFooter('For command help run +help');
  msg.channel.send(embed);
};

export const name = 'info';
export const description = 'Get bot info';
