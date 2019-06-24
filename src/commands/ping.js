import { MessageEmbed } from 'discord.js';

export const run = async (client, msg) => {
  const embed = new MessageEmbed()
    .setTitle(':ping_pong:')
    .addField(`**Ping**: ${Math.round(client.ws.ping)}ms`, '[]()')
    .addField('**Latency**: Loading...', '[]()');
  const m = await msg.channel.send(embed);
  const start = Date.now();
  embed.fields[1].name = '**Latency**: Loaded!';
  await m.edit(embed);
  embed.fields[1].name = `**Latency**: ${Date.now() - start}ms`;
  m.edit(embed);
};

export const name = 'ping';
export const description = 'Test the bot\'s ping + latency';
