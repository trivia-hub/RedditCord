import { MessageEmbed } from 'discord.js';
import { inspect } from 'util';

export const run = (client, msg, args) => {
  const toEval = args.join(' ');
  try {
    // eslint-disable-next-line no-eval
    const evalResult = eval(toEval);
    const embed = new MessageEmbed()
      .setTitle('Eval Succeeded')
      .setDescription(`\`\`\`js\n${inspect(evalResult)}\`\`\``)
      .setFooter(`Type: ${typeof evalResult}`);
    msg.channel.send(embed);
  } catch (e) {
    const embed = new MessageEmbed()
      .setTitle('Eval Failed')
      .setDescription(`\`\`\`js\n${e}\`\`\``);
    msg.channel.send(embed);
  }
};

export const name = 'eval';
export const description = 'Eval javascript code';
export const permissionLevel = 2;
export const args = [{ name: 'toEval', optional: false }];
