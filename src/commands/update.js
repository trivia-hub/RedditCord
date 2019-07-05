import { promisify } from 'util';
import { get } from 'node-cmd';

export const run = async (client, msg) => {
  const runCmd = promisify(get);
  const m = await msg.channel.send('(1/4) Pulling changes...');
  await runCmd('git pull');
  await m.edit('(2/4) Updating dependencies...');
  await runCmd('npm install');
  await m.edit('(3/4) Building changes...');
  await runCmd('npm run build');
  await m.edit('(4/4) Reloading commands...');
  client.reloadCommands();
  m.edit('Finished updating!');
};

export const name = 'update';
export const description = 'Pull any new changes from github';
export const permissionLevel = 2;
