import * as subreddit from './subreddit';

export const run = (client, msg, args) => {
  subreddit.run(client, msg, ['', args[0] || 'best']);
};

export const name = 'homepage';
export const description = 'Get reddit homepage posts';
export const alias = 'home';
export const args = [{ name: 'filter', optional: true }];
