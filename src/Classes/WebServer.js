/* eslint-disable camelcase */
import express from 'express';
import { EventEmitter } from 'events';
import Reddit from './Reddit';

export default class WebServer extends EventEmitter {
  constructor(port, mongo) {
    super();
    this.db = mongo;
    this.port = port;
    this.app = express();
    this.app.listen(port, () => this.emit('ready', port));
    this.app.get('/api/login', this.login.bind(this));
    // this.app.get('/api/logout', this.logout.bind(this));
    this.app.get('*', req => this.emit('GET', req.path));
  }

  async login(req, res) {
    const { code, state } = req.query;
    if (!code) {
      res.send('No code was provided.');
      return;
    }
    if (!state) {
      res.send('No state was provided.');
      return;
    }
    await this.db.setOAuth(state, code);
    const user = await this.db.getUser(state);
    const reddit = new Reddit(null, code);
    const body = await reddit.getAccessToken();
    user.refreshToken = body.refresh_token;
    await this.db.updateUser(state, user);
    res.send('Login success!');
    this.emit('login', { id: state, oauth: code });
  }

  async logout(req, res) {
    const { id } = req.query;
    if (!id) {
      res.send('No id was provided.');
      return;
    }
    await this.db.initUser(id);
    const user = await this.db.getUser(id);
    if (!user.refreshToken) {
      res.send('You aren\'t logged in.');
      return;
    }
    user.refreshToken = null;
    user.oauth = null;
    await this.db.updateUser(id, user);
    res.send('Logout success!');
  }
}
