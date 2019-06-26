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
    let url = `https://reddit.com/r/${subreddit}/${filter}.json?limit=100`;
    if (before) url += `&before=${before}`;
    if (after) url += `&after=${after}`;
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
}
