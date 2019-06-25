import { MessageEmbed } from 'discord.js';
import { reddit } from '../../config';

export const run = async (client, msg) => {
  if (await client.db.getUser(msg.author.id).oauth) {
    const embed = new MessageEmbed()
      .setTitle('You are already logged in.');
    msg.channel.send(embed);
    return;
  }
  const embed = new MessageEmbed()
    .setTitle('Click here to login!')
    .setURL(reddit.oauthUrl.replace('USERID', msg.author.id));
  msg.channel.send(embed);
  client.webserver.on('login', (u) => {
    if (u.id === msg.author.id) {
      const successEmbed = new MessageEmbed()
        .setTitle('You are now logged in!');
      msg.channel.send(`${msg.author}:`);
      msg.channel.send(successEmbed);
    }
  });
};

export const name = 'login';
export const description = 'Login to discord via oauth';
