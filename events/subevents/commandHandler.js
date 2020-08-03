const Discord = require('discord.js');
const config = require('../../config.json');
const cd = [];

module.exports.run = obj => {
    const client = obj.client;
    const message = obj.message;
    const args = obj.args;
    const maindb = obj.maindb;
    const alicedb = obj.alicedb;
    const command = obj.command;
    const current_map = obj.current_map;
    const command_cooldown = obj.command_cooldown;
    const maintenance = obj.maintenance;
    const maintenance_reason = obj.maintenance_reason;
    const main_bot = obj.main_bot;

    let cmd = client.commands.get(command.slice(main_bot ? config.prefix.length : 1)) || client.aliases.get(command.slice(main_bot ? config.prefix.length : 1));
    if (cmd) {
        if (maintenance && !message.isOwner) return message.channel.send(`❎ **| I'm sorry, I'm currently under maintenance due to \`${maintenance_reason}\`. Please try again later!**`);
        message.channel.startTyping().catch(console.error);
        setTimeout(() => {
            message.channel.stopTyping(true)
        }, 5000);
        const cd_entry = cd.find(e => e === message.author.id);
        if (cd_entry) return message.channel.send(`❎ **| Hey, calm down with the command! I need to rest too, you know.**`);
        if (!(message.channel instanceof Discord.DMChannel)) console.log(`${message.author.tag} (#${message.channel.name}): ${message.content}`);
        else console.log(`${message.author.tag} (DM): ${message.content}`);
        cmd.run(client, message, args, maindb, alicedb, current_map);
        if (command_cooldown && !message.isOwner) {
            cd.push(message.author.id);
            setInterval(() => {
                const index = cd.findIndex(c => c === message.author.id);
                cd.splice(index, 1);
            })
        }
    }
};

module.exports.config = {
    name: "commandHandler"
};
