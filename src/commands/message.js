import Reddit from '../Classes/Reddit';

export const run = async (client, message, args) => {
  const { author: { id }, channel } = message;
  const { refreshToken } = await client.db.initUser(id) || await client.db.getUser(id);

  if (!refreshToken) {
    return message.reply('You aren\'t logged in, please run +login.').then(r => setTimeout(() => r.delete(), 3E3));
  }

  const reddit = new Reddit(refreshToken);

  channel.send('What\'s this message\'s subject? Type "cancel" to cancel.');

  const subject = await new Promise(resolve => channel
    .createMessageCollector(m => m.author.id === id, { time: 3E4 })
    .once('collect', ({ content }) => resolve(content))
    .on('end', () => resolve()));

  if (!subject) return channel.send('The operation has timed out. Cannot continue.');

  if (subject.toLowerCase() === 'cancel') return channel.send('The operation has been canceled.');

  if (subject.length > 100) return channel.send('The message subject cannot exceed 100 characters. Cannot continue.');

  channel.send('Enter the text to send:');

  const text = await new Promise(resolve => channel
    .createMessageCollector(m => m.author.id === id, { time: 6E4 })
    .once('collect', ({ content }) => resolve(content))
    .on('end', () => resolve()));

  if (!text) return channel.send('The operation has timed out. Cannot continue.');

  if (!args[0]) channel.send('To whom would you like to send the message?');

  const to = args[0] || await new Promise(resolve => channel
    .createMessageCollector(m => m.author.id === id, { time: 3E4 })
    .once('collect', ({ content }) => resolve(content))
    .on('end', () => resolve()));

  if (!to) return channel.send('The operation has timed out. Cannot continue.');

  const { success } = await reddit.sendMessage(subject, text, to);

  return message.reply(success ? 'Sent message :white_check_mark:' : 'Couldn\'t send message :no_entry_sign:');
};

export const name = 'message';
export const description = 'Send a direct message to another user on Reddit';
export const args = [{ name: 'user', optional: true }];
export const alias = 'm';
