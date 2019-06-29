import Reddit from '../Classes/Reddit';

export const run = async (client, message, args) => {
  const { author: { id }, channel } = message;
  const { refreshToken } = await client.db.initUser(id) || await client.db.getUser(id);

  if (!refreshToken) {
    return message.reply('You aren\'t logged in, please run +login.').then(r => setTimeout(() => r.delete(), 3E3));
  }

  const reddit = new Reddit(refreshToken);

  channel.send('What\'s this post\'s title? Type "cancel" to cancel.');

  const title = await new Promise(resolve => channel
    .createMessageCollector(m => m.author.id === id, { time: 3E4 })
    .once('collect', ({ content }) => resolve(content))
    .on('end', () => resolve()));

  if (!title) return channel.send('The operation has timed out. Cannot continue.');

  if (title.toLowerCase() === 'cancel') return channel.send('The operation has been canceled.');

  if (title.length > 100) return channel.send('The post title cannot exceed 100 characters. Cannot continue.');

  const kind = await new Promise(async resolve => (await channel
    .send('Select this post\'s type: :pencil: = text post | :link: = link post')
    .then(m => m.react('📝')
      && m.react('🔗')
      && m.createReactionCollector(({ emoji: { name } }, user) => (name === '📝' || name === '🔗')
        && user.id === id, { time: 3E4 })))
    .once('collect', (({ emoji: { name } }) => resolve(({ '📝': 'self', '🔗': 'link' })[name])))
    .on('end', () => resolve()));

  if (!kind) return channel.send('The operation has timed out. Cannot continue.');

  channel.send(`Enter the ${kind === 'self' ? 'content' : 'link'} to post:`);

  const data = await new Promise(resolve => channel
    .createMessageCollector(m => m.author.id === id, { time: 6E4 })
    .once('collect', ({ content }) => resolve(content))
    .on('end', () => resolve()));

  if (!data) return channel.send('The operation has timed out. Cannot continue.');

  if (!args[0]) channel.send('To where would you like to post?');

  const sr = args[0] || await new Promise(resolve => channel
    .createMessageCollector(m => m.author.id === id, { time: 3E4 })
    .once('collect', ({ content }) => resolve(content))
    .on('end', () => resolve()));

  if (!sr) return channel.send('The operation has timed out. Cannot continue.');

  const { success } = await reddit.post(title, data, sr, kind);

  return message.reply(success ? 'Submitted post :white_check_mark:' : 'Couldn\'t submit post :no_entry_sign:');
};

export const name = 'post';
export const description = 'Submit a text or link post to Reddit';
export const args = [{ name: 'subreddit', optional: true }];
export const alias = 'p';
