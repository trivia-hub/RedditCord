import express from 'express';
import { EventEmitter } from 'events';

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
    res.send('Login success!');
    this.emit('login', { id: state, oauth: code });
  }
}
