import { EventEmitter } from 'events';
import request from 'request';
import { promisify } from 'util';
import { webserver, reddit } from '../../config';

export default class Reddit extends EventEmitter {
  constructor(refreshToken, oauth) {
    super();
    this.refreshToken = refreshToken;
    this.oauth = oauth;
    this.accessToken = null;
    this.req = promisify(request);
    if (this.refreshToken) {
      this.privateMessageGetter = setInterval(async () => {
        const res = await this.getUnreadMessages();
        if (res.messages.length) {
          res.messages.forEach(m => this.readMessage(m.name));
          this.emit('message', res.messages);
        }
      }, 30000);
    }
  }

  async getAccessToken() {
    const { body } = await this.req('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      body: `grant_type=authorization_code&code=${this.oauth}&redirect_uri=http://${webserver.host}:${webserver.port}/${webserver.endpoints.login}`,
      headers: {
        Authorization: reddit.auth,
      },
    });
    return JSON.parse(body);
  }

  async refreshAccessToken() {
    const { body } = await this.req('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      body: `grant_type=refresh_token&refresh_token=${this.refreshToken}`,
      headers: {
        Authorization: reddit.auth,
      },
    });
    this.accessToken = JSON.parse(body).access_token;
    return this.accessToken;
  }

  async getSubredditPosts(subreddit, filter, before, after) {
    let url = `https://reddit.com/r/${subreddit}/${filter || 'best'}.json?limit=100`;
    if (this.refreshToken) url = `https://oauth.reddit.com/r/${subreddit}/${filter || 'best'}.json?api_type=json&limit=100&raw_json=1`;
    if (subreddit === '') url = url.replace('r//', '');
    if (before) url += `&before=${before}`;
    if (after) url += `&after=${after}`;
    const options = {
      json: true,
    };
    if (this.refreshToken) {
      await this.refreshAccessToken();
      options.headers = {
        'User-Agent': 'RedditCord v1.0 (by u/vilP1l)',
        Authorization: `bearer ${this.accessToken}`,
      };
    }
    const { body } = await this.req(url, options);
    if (!body.data) {
      body.data = {
        children: [],
        before: null,
        after: null,
      };
    }
    return {
      posts: body.data.children.map(c => c.data),
      before: body.data.before,
      after: body.data.after,
    };
  }

  async vote(id, dir) {
    await this.refreshAccessToken();
    const { body } = await this.req('https://oauth.reddit.com/api/vote', {
      method: 'POST',
      form: {
        dir,
        id,
        api_type: 'json',
        raw_json: 1,
      },
      headers: {
        'User-Agent': 'RedditCord v1.0 (by u/vilP1l)',
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `bearer ${this.accessToken}`,
      },
    });
    return JSON.parse(body);
  }

  async upvote(id) {
    await this.vote(id, 1);
  }

  async downvote(id) {
    await this.vote(id, -1);
  }

  async searchAll(term, allowNsfw, sort, time) {
    const url = `https://reddit.com/search.json?q=${term}${allowNsfw ? '&include_over_18=on' : ''}&restrict_sr=&sort=${sort || 'relevance'}&t=${time || 'all'}`;
    const { body } = await this.req(url, { json: true });
    if (!body.data) {
      body.data = {
        children: [],
        before: null,
        after: null,
      };
    }
    return {
      posts: body.data.children.map(c => c.data),
      before: body.data.before,
      after: body.data.after,
    };
  }

  async getUnreadMessages() {
    await this.refreshAccessToken();
    const { body } = await this.req('https://oauth.reddit.com/message/unread?limit=100&mark=true', {
      headers: {
        'User-Agent': 'RedditCord v1.0 (by u/vilP1l)',
        Authorization: `bearer ${this.accessToken}`,
      },
      json: true,
    });
    return {
      messages: body.data.children.map(c => c.data),
      after: body.data.after,
      before: body.data.before,
    };
  }

  async readMessage(id) {
    await this.refreshAccessToken();
    const { body } = await this.req(`https://oauth.reddit.com/api/read_message?api_type=json&id=${id}&raw_json=1`, {
      method: 'POST',
      headers: {
        'User-Agent': 'RedditCord v1.0 (by u/vilP1l)',
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `bearer ${this.accessToken}`,
      },
    });
    return body;
  }
}
