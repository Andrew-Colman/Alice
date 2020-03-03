const Discord = require("discord.js");
const config = require("../config.json");
const cd = new Set();

module.exports.run = async (client, message, args) => {
    if (message.channel instanceof Discord.DMChannel) return message.channel.send("This command is not allowed in DMs");
    if (!args[0]) return;
    if (message.member.roles.cache.find((r) => r.name === 'report-ban')) {
        message.author.lastMessage.delete().catch(console.error);
        return message.reply("you were banned from submitting reports!").then (message => {
            message.delete({timeout: 5000})
        });
    }
    let channel = message.guild.channels.cache.find((c) => c.name === config.report_channel);
    if (!channel) return message.reply(`please create #${config.report_channel} first!`);
    let user = message.author.id;
    if (message.member.roles.cache.find((r) => r.name === 'Helper') || message.member.roles.cache.find((r) => r.name === 'Moderator')) cd.delete(user);
    if (cd.has(user)) return message.reply("you are still on cooldown!").then(message => message.delete({timeout: 5000}));

    let toreport = message.guild.member(message.mentions.users.first() || message.guild.members.cache.get(args[0]));
    if (!toreport) return message.reply("please make sure you have entered the correct user!");
    if (toreport.hasPermission("ADMINISTRATOR")) return message.reply("you cannot report this user!");
    if (toreport.id == message.author.id) return message.reply("you cannot report yourself!");
    let reason = args.slice(1).join(" ");
    if (!reason) return message.reply("please add a reason.");

    message.author.lastMessage.delete().catch(console.error);

    let rolecheck;
    try {
        rolecheck = message.member.roles.highest.hexColor
    } catch (e) {
        rolecheck = "#000000"
    }
    let reportembed = new Discord.MessageEmbed()
        .setAuthor(message.author.tag, message.author.avatarURL({dynamic: true}))
        .setColor(rolecheck)
        .setTimestamp(new Date())
        .setFooter("React to this message upon completing report based on decision given")
        .addField("Reported user: " + toreport.user.username, "Reported in: " + message.channel)
        .addField("Reason: ", reason);

    channel.send("<@&369108742077284353> <@595667274707370024>", {embed: reportembed});
    let footer = config.avatar_list;
    const index = Math.floor(Math.random() * footer.length);

    let replyembed = new Discord.MessageEmbed()
        .setTitle("Report statistics")
        .setColor("#527ea3")
        .setTimestamp(new Date())
        .setFooter("Alice Synthesis Thirty", footer[index])
        .addField("Reported user: " + toreport.user.username, "Reported in: " + message.channel)
        .addField("Reason: " + reason, "Make sure you have evidence ready!\nAbuse of this command will make you unable to submit reports.");

    try {
        await message.author.send({embed: replyembed});
    } catch (e) {
        message.reply("your DM is locked, so you didn't receive a copy of your report. Sorry!").then(message => {
            message.delete({timeout: 5000})
        })
    }

    let cooldown = config.member_cooldown;
    if (!message.member.roles.cache.find((r) => r.name === 'Helper') && !message.member.roles.cache.find((r) => r.name === 'Moderator')) {
        cd.add(user);
        setTimeout(() => {
            cd.delete(user)
        }, cooldown * 1000)
    }
};

module.exports.config = {
    name: "report",
    description: "Reports a user for breaking rules.",
    usage: "report <user> <reason>",
    detail: "`user`: The user to report [UserResolvable (mention or user ID)]\n`reason`: Reason for reporting [String]",
    permission: "None"
};
