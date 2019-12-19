import { MongoClient } from 'mongodb';
import { EventEmitter } from 'events';

export default class Mongo extends EventEmitter {
  constructor(options) {
    super();
    if (!options.user) throw new Error('No username was provided.');
    if (!options.pass) throw new Error('No password was provided.');
    if (!options.host) throw new Error('No host was provided.');
    if (!options.db) throw new Error('No database was provided.');
    this.user = options.user;
    this.pass = options.pass;
    this.host = options.host;
    this.dbName = options.db;
    this.db = null;
  }

  connect() {
    MongoClient.connect(`mongodb://${this.user}:${this.pass}@${this.host}`, { useNewUrlParser: true }, (err, client) => {
      if (err) throw new Error(err);
      this.db = client.db(this.dbName);
      this.emit('connected');
    });
  }

  async getUser(id) {
    if (!this.db) throw new Error('No database connection is currently active.');
    const user = await this.db.collection('users').findOne({ id });
    return user;
  }

  async getGuild(id) {
    if (!this.db) throw new Error('No database connection is currently active.');
    const guild = await this.db.collection('guilds').findOne({ id });
    return guild;
  }

  async updateUser(id, data) {
    if (!this.db) throw new Error('No database connection is currently active.');
    await this.initUser(id);
    await this.db.collection('users').updateOne({ id }, { $set: data });
    this.emit('userUpdated', data);
    return true;
  }

  async updateGuild(id, data) {
    if (!this.db) throw new Error('No database connection is currently active.');
    await this.initGuild(id);
    await this.db.collection('guilds').updateOne({ id }, { $set: data });
    this.emit('guildUpdated', data);
    return true;
  }

  async initUser(id) {
    if (!this.db) throw new Error('No database connection is currently active.');
    if (!await this.getUser(id)) {
      await this.db.collection('users').insertOne({
        id,
        filter: null,
        oauth: null,
      });
      this.emit('userCreated', id);
      return true;
    }
    return false;
  }

  async initGuild(id) {
    if (!this.db) throw new Error('No database connection is currently active.');
    if (!await this.getGuild(id)) {
      await this.db.collection('guilds').insertOne({
        id,
        feeds: [],
      });
      this.emit('guildCreated', id);
      return true;
    }
    return false;
  }

  async setOAuth(id, oauth) {
    if (!this.db) throw new Error('No database connection is currently active.');
    await this.initUser(id);
    const user = await this.getUser(id);
    user.oauth = oauth;
    await this.updateUser(id, user);
    return true;
  }
}
