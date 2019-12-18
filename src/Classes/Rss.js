import { EventEmitter } from 'events';
import RssParser from 'rss-parser';

export default class Rss extends EventEmitter {
  constructor(url, refreshRate = 10000, autoStart = true) {
    super();

    this.url = url;
    this.refreshRate = refreshRate;
    this.posts = [];
    this.parser = new RssParser();
    this.interval = null;

    if (autoStart) this.start();
  }

  async fetch() {
    const { items } = await this.parser.parseURL(this.url);

    if (!this.posts.length) this.posts = items;
    if (JSON.stringify(items) !== JSON.stringify(this.posts)) {
      const newPosts = items.filter(x => !this.posts.map(p => p.link).includes(x.link));

      newPosts.forEach(p => this.emit('post', p));
      this.posts = items;
    }
  }

  start() {
    this.interval = setInterval(() => {
      this.fetch();
    }, this.refreshRate);
  }

  stop() {
    clearInterval(this.interval);
  }
}
