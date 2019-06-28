# RedditCord

<img src="assets/banner.png" width="400">

Discord Reddit Client made for Discord Hack Week  
[**Testing Server**](https://discord.gg/H5kCpg4)  
[**Invite Link**](https://discordapp.com/api/oauth2/authorize?client_id=592798439751024650&permissions=1073752128&scope=bot)

## Features


### Subreddit Browsing

<img src="assets/subreddit.jpg" width="400">

### Post Viewing

<img src="assets/post-viewing.jpg" width="400">

### Voting

<img src="assets/voting.gif" width="400">

### Commenting 

<img src="assets/commenting.gif" width="400">

## Team

### vilP1l#0001

- Lead Developer
- Testing

### SpotiKona#0001

- Testing

### its a-me markio#9733

- Minor Additions
- Testing

## Setup

You will need nodejs and npm for this bot.

Run `npm install` to install the requried dependencies.

Run `npm run build` or `yarn build`  
This will compile the source code with babel and create a folder called lib with the compiled code.

Rename config-example.json to config.json and remove the note.

Create a discord application & bot [here](https://discordapp.com/developers/applications) and put the bot token in your config file.

Put your discord id in the array of owner ids so you can use commands such as eval and reload.

You will need to setup a MongoDB database for this bot to work, Mongo stores reddit authentication tokens which are required for most api actions.  
Once you have setup Mongo, put the database name you want to use, username, password, and host (localhost if you installed Mongo locally) in the mongo section of your config file.

Next, create a reddit application [here](https://www.reddit.com/prefs/apps) with the type of "web app". Create a reddit oauth url with [this guide](https://github.com/reddit-archive/reddit/wiki/oauth2) and with these scopes: identity,submit,subscribe,vote,mysubreddits,read,edit,privatemessages, for the state use USERID. For the auth token go to [this site](https://www.base64encode.org/) and encode `YOUR_APP_ID:YOUR_APP_SECRET`, paste the encoded string into your config file.

Finally setup the webserver, set the port you want to use and what host it will you (localhost if hosting locally). For the login endpoint set it to `api/login`.

You can now start the bot with `node lib/index.js`!

If you need any help with these instructions, feel free to message me on Discord: vilP1l#0001, or create a GitHub issue.
