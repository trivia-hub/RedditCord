import { MessageEmbed } from 'discord.js';

export const run = async (client, msg) => {
  await client.db.initUser(msg.author.id);
  const user = await client.db.getUser(msg.author.id);
  if (!user.refreshToken) {
    const embed = new MessageEmbed()
      .setTitle('You aren\'t logged in.');
    msg.channel.send(embed);
    return;
  }
  user.oauth = null;
  user.refreshToken = null;
  await client.db.updateUser(msg.author.id, user);
  const embed = new MessageEmbed()
    .setTitle('Logged out!');
  msg.channel.send(embed);
};

export const name = 'logout';
export const description = 'Logout from reddit oauth';
