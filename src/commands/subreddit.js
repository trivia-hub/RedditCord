import { MessageEmbed, ReactionCollector } from 'discord.js';
import { toWords } from 'number-to-words';
import Reddit from '../Classes/Reddit';

export const run = async (client, msg, args) => {
  if (!args[0]) {
    const embed = new MessageEmbed()
      .setTitle('No subreddit name was provided.');
    msg.channel.send(embed);
    return;
  }
  await client.db.initUser(msg.author.id);
  const { refreshToken } = await client.db.getUser(msg.author.id);
  const reddit = new Reddit(refreshToken);
  msg.channel.startTyping();
  const res = await reddit.getSubredditPosts(args[0], 'hot');
  msg.channel.stopTyping();
  if (!res.posts.length) {
    const embed = new MessageEmbed()
      .setTitle('Invalid subreddit provided.');
    msg.channel.send(embed);
    return;
  }
  const embed = new MessageEmbed()
    .setTitle(`r/${args[0]} - Hot`);
  const loadPosts = async (page) => {
    embed.setFooter(`Page ${page + 1}`);
    embed.fields = [];
    const posts = [...res.posts];
    posts.splice(0, page * 5 + 1);
    if (!posts.length) {
      const newPosts = await reddit.getSubredditPosts(args[0], 'hot', null, res.after);
      newPosts.forEach(p => posts.push(p));
      res.after = newPosts.after;
      return loadPosts(page);
    }
    posts.forEach((p, i) => {
      if (i > 4) return;
      embed.addField(`:${toWords(i + 1)}: - ${p.title}`, '[]()');
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
    embed
      .setTitle(post.title)
      .setURL(`https://reddit.com${post.permalink}`)
      .setDescription(`**Submitted by [u/${post.author}](https://reddit.com/u/${post.author})**`)
      .setFooter(`${post.score} Upvotes | ${post.num_comments} Comments`);
    if (post.reddit_video) embed.setImage(post.reddit_video.fallback_url);
    if (post.post_hint === 'image') embed.setImage(post.url);
    if (post.selftext) post.selftextPostDesc = `**Submitted by [u/${post.author}](https://reddit.com/u/${post.author})**\n${post.selftext}`;
    if (post.selftext) embed.setDescription(post.selftextPostDesc.slice(0, 2000));
    await m.edit(embed);
  };
  await m.react('⬅');
  await m.react('➡');
  const filter = (r, u) => u.id === msg.author.id;
  const collector = new ReactionCollector(m, filter);
  const numberEmojis = ['1⃣', '2⃣', '3⃣', '4⃣', '5⃣'];
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
      embed.image = null;
      embed.url = null;
      embed.description = null;
      embed.setTitle(`r/${args[0]} - Hot`);
      await loadPosts(page);
      await m.edit(embed);
      numberEmojis.forEach(e => m.react(e));
    }
    if (numberEmojis.includes(r.emoji.name)) {
      const index = numberEmojis.indexOf(r.emoji.name);
      await loadPost(index);
      await m.react('❌');
    }
  });
};

export const name = 'subreddit';
export const description = 'Get posts from a subreddit';
export const args = [{ name: 'subreddit', optional: false }];
export const alias = 's';
