import { MessageEmbed, ReactionCollector } from 'discord.js';
import { toWords } from 'number-to-words';
import Reddit from '../Classes/Reddit';

export const run = async (client, msg, args) => {
  if (!args[0] && args[0] !== '') {
    const embed = new MessageEmbed()
      .setTitle('No subreddit name was provided.');
    msg.channel.send(embed);
    return;
  }
  if (args[1] && args[1] !== 'top' && args[1] !== 'hot' && args[1] !== 'best' && args[1] !== 'new') {
    const embed = new MessageEmbed()
      .setTitle('Invalid filter provided.');
    msg.channel.send(embed);
    return;
  }
  await client.db.initUser(msg.author.id);
  const { refreshToken } = await client.db.getUser(msg.author.id);
  const reddit = new Reddit(refreshToken);
  msg.channel.startTyping();
  const res = await reddit.getSubredditPosts(args[0], args[1] || 'best');
  msg.channel.stopTyping();
  if (!res.posts.length) {
    const embed = new MessageEmbed()
      .setTitle('Invalid subreddit provided.');
    msg.channel.send(embed);
    return;
  }
  const embed = new MessageEmbed()
    .setTitle(`r/${args[0]} - ${args[1] || 'best'}`);
  const loadPosts = async (page) => {
    embed.setFooter(`Page ${page + 1}`);
    embed.fields = [];
    const posts = [...res.posts];
    posts.splice(0, page * 5 + 1);
    if (!posts.length) {
      const newPosts = await reddit.getSubredditPosts(args[0], args[1] || 'best', null, res.after);
      newPosts.forEach(p => posts.push(p));
      res.after = newPosts.after;
      return loadPosts(page);
    }
    posts.forEach((p, i) => {
      if (i > 4) return;
      embed.addField(`:${toWords(i + 1)}: - ${p.title}`.slice(0, 250), '[]()');
    });
    return posts;
  };
  let page = 0;
  loadPosts(0);
  const m = await msg.channel.send(embed);
  const loadPost = async (index) => {
    const posts = [...res.posts];
    posts.splice(0, page * 5 + 1);
    const post = posts[index];
    embed.fields = [];
    embed.image = null;
    embed.footer = null;
    if (post.over_18 && !msg.channel.nsfw) {
      embed
        .setTitle('This channel is not set to NSFW.');
      await m.edit(embed);
    } else {
      embed
        .setTitle(post.title.slice(0, 250))
        .setURL(`https://reddit.com${post.permalink}`)
        .setDescription(`**Submitted by [u/${post.author}](https://reddit.com/u/${post.author}) to [r/${post.subreddit}](https://reddit.com/r/${post.subreddit})**`)
        .setFooter(`${post.score} Upvotes | ${post.num_comments} Comments`);
      if (post.media && post.media.reddit_video) embed.setImage(`${post.media.reddit_video.fallback_url}.mp4`);
      if (post.post_hint === 'image') embed.setImage(post.url);
      if (post.selftext) post.selftextPostDesc = `**Submitted by [u/${post.author}](https://reddit.com/u/${post.author}) to [r/${post.subreddit}](https://reddit.com/r/${post.subreddit})**\n${post.selftext}`;
      if (post.selftext) embed.setDescription(post.selftextPostDesc.slice(0, 2000));
      await m.edit(embed);
    }
  };
  await m.react('⬅');
  await m.react('➡');
  const voteEmojis = ['👍', '👎'];
  const filter = (r, u) => {
    if (voteEmojis.includes(r.emoji.name) && !u.bot) return true;
    return u.id === msg.author.id;
  };
  const collector = new ReactionCollector(m, filter);
  const numberEmojis = ['1⃣', '2⃣', '3⃣', '4⃣', '5⃣'];
  let index;
  numberEmojis.forEach(e => m.react(e));
  collector.on('collect', async (r, u) => {
    r.users.remove(u);
    if (r.emoji.name === '➡') {
      const x = m.reactions.find(re => re.emoji.name === '❌');
      if (x) return;
      page += 1;
      await loadPosts(page);
      m.edit(embed);
    }
    if (r.emoji.name === '⬅') {
      const x = m.reactions.find(re => re.emoji.name === '❌');
      if (x) return;
      if (page === 0) return;
      page -= 1;
      await loadPosts(page);
      m.edit(embed);
    }
    if (r.emoji.name === '❌') {
      const reaction = m.reactions.find(re => re.emoji.name === '❌');
      if (reaction) reaction.users.forEach(user => reaction.users.remove(user));
      const commentReaction = m.reactions.find(re => re.emoji.name === '📝');
      if (commentReaction) {
        commentReaction.users.forEach(user => commentReaction.users.remove(user));
      }
      voteEmojis.forEach((e) => {
        const voteReaction = m.reactions.find(re => re.emoji.name === e);
        if (voteReaction) voteReaction.users.forEach(user => voteReaction.users.remove(user));
      });
      embed.image = null;
      embed.url = null;
      embed.description = null;
      embed.setTitle(`r/${args[0]} - ${args[1] || 'best'}`);
      await loadPosts(page);
      await m.edit(embed);
    }
    if (numberEmojis.includes(r.emoji.name)) {
      index = numberEmojis.indexOf(r.emoji.name);
      await loadPost(index);
      await m.react('❌');
      voteEmojis.forEach(e => m.react(e));
      await m.react('📝');
    }
    if (r.emoji.name === '👍' || r.emoji.name === '👎') {
      await client.db.initUser(u.id);
      // eslint-disable-next-line no-shadow
      const { refreshToken } = await client.db.getUser(u.id);
      // eslint-disable-next-line no-shadow
      const reddit = new Reddit(refreshToken);
      if (!refreshToken) {
        const reply = await msg.channel.send(`${u}, You aren't logged in, please run +login.`);
        setTimeout(() => reply.delete(), 3000);
        return;
      }
      const posts = [...res.posts];
      posts.splice(0, page * 5 + 1);
      const post = posts[index];
      if (r.emoji.name === '👍') {
        await reddit.upvote(post.name);
        const reply = await msg.channel.send(`${u}, Successfully upvoted post!`);
        setTimeout(() => reply.delete(), 3000);
      } else {
        await reddit.downvote(post.name);
        const reply = await msg.channel.send(`${u}, Successfully downvoted post!`);
        setTimeout(() => reply.delete(), 3000);
      }
    }
    if (r.emoji.name === '📝') {
      if (!refreshToken) {
        const reply = await msg.reply('You aren\'t logged in, please run +login.');
        setTimeout(() => reply.delete(), 3000);
        return;
      }
      const posts = [...res.posts];
      posts.splice(0, page * 5 + 1);
      const post = posts[index];
      const prompt = await msg.reply('What would you like to comment? (to cancel type cancel)');
      const messageFilter = message => message.author.id === msg.author.id;
      const messages = await msg.channel.awaitMessages(messageFilter, { max: 1 });
      const message = messages.first();
      if (message.content === 'cancel') {
        await message.delete();
        await prompt.delete();
        const reply = await msg.reply('Canceled');
        setTimeout(() => reply.delete(), 3000);
        return;
      }
      const postRes = await reddit.postComment(post.name, message.content);
      await message.delete();
      await prompt.delete();
      if (!postRes.json || postRes.json.errors.length) {
        const reply = await msg.reply('Error submitting comment.');
        setTimeout(() => reply.delete(), 3000);
        return;
      }
      const reply = await msg.reply('Successfully submitted comment!');
      setTimeout(() => reply.delete(), 3000);
    }
  });
};

export const name = 'subreddit';
export const description = 'Get posts from a subreddit';
export const args = [{ name: 'subreddit', optional: false }, { name: 'filter', optional: true }];
export const alias = 's';
