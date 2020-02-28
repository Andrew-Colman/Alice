const Discord = require('discord.js');
const request = require('request');
const tatsukey = process.env.TATSU_API_KEY;
const config = require('../config.json');

function isEligible(member) {
    let res = 0;
    let eligibleRoleList = config.mute_perm;
    eligibleRoleList.forEach((id) => {
        if(member.roles.has(id[0])) res = id[1]
    });
    return res
}

function voteStringProcessing(topic, choices) {
    let string = `**Topic: ${topic}**\n\n`;
    for (let i = 0; i < choices.length; i++) string += `\`[${i+1}] ${choices[i][0]} - ${choices[i][1]}\`\n\n`;
    return string
}

module.exports.run = (client, message, args, maindb, alicedb) => {
    if (message.channel instanceof Discord.DMChannel) return;

    let xp_req = 20000;
    let votedb = alicedb.collection("voting");

    switch (args[0]) {
        case "start": {
            votedb.findOne({channel: message.channel.id}, (err, res) => {
                if (err) {
                    console.log(err);
                    return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                }
                if (res) return message.channel.send("❎ **| I'm sorry, a vote is active in this channel!**");
                let url = `https://api.tatsumaki.xyz/guilds/${message.guild.id}/members/${message.author.id}/stats`;
                request(url, {headers: {"Authorization": tatsukey}}, (err, response, data) => {
                    if (err) {
                        console.log(err);
                        return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from Tatsumaki's API. Please try again!**");
                    }
                    let user_stats = JSON.parse(data);
                    let user_score = parseInt(user_stats.score);
                    if (user_score < xp_req && !isEligible(message.member)) return message.channel.send(`❎ **| I'm sorry, you are not eligible enough to vote! You need at least \`${xp_req}\` Tatsu server XP unless you're a staff member!**`);

                    let entry = args.slice(1).join(" ");
                    if (entry.indexOf("|") === -1) return message.channel.send("❎ **| I'm sorry, your format is invalid!**");
                    let topic = entry.substring(0, entry.indexOf("|")).trim();
                    let choices = entry.substring(entry.indexOf("|")).split("|");
                    let choice_list = [];
                    for (let i = 0; i < choices.length; i++) {
                        if (!choices[i].trim()) continue;
                        choice_list.push([choices[i].trim(), 0, []])
                    }

                    let insertVal = {
                        initiator: message.author.id,
                        channel: message.channel.id,
                        topic: topic,
                        choices: choice_list
                    };

                    votedb.insertOne(insertVal, err => {
                        if (err) {
                            console.log(err);
                            return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                        }
                        message.channel.send(`✅ **| Successfully started vote.**\n${voteStringProcessing(topic, choice_list)}`)
                    })
                })
            });
            break
        }
        case "end": {
            votedb.findOne({channel: message.channel.id}, (err, res) => {
                if (err) {
                    console.log(err);
                    return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                }
                if (!res) return message.channel.send("❎ **| I'm sorry, there is no ongoing vote in this channel!**");
                if (message.author.id != res.initiator && message.member.hasPermission("ADMINISTRATOR", false, true, true)) return message.channel.send("❎ **| I'm sorry, you don't have the permission to end ongoing vote!**")
                let topic = res.topic;
                let choices = res.choices;
                votedb.deleteOne({initiator: res.initiator}, err => {
                    if (err) {
                        console.log(err);
                        return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                    }
                    message.channel.send(`✅ **| Vote ended!**\n${voteStringProcessing(topic, choices)}`)
                })
            });
            break
        }
        case "check": {
            votedb.findOne({channel: message.channel.id}, (err, res) => {
                if (err) {
                    console.log(err);
                    return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                }
                if (!res) return message.channel.send("❎ **| I'm sorry, there is no ongoing vote in this channel!**");
                message.channel.send(voteStringProcessing(res.topic, res.choices))
            });
            break
        }
        default: {
            votedb.findOne({channel: message.channel.id}, (err, res) => {
                if (err) {
                    console.log(err);
                    return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                }
                if (!res) return message.channel.send("❎ **| I'm sorry, there is no ongoing vote in this channel!**");
                let choice = parseInt(args[0]) - 1;
                let choices = res.choices;
                if (isNaN(choice) || choice < 0 || choice > choices.length) return message.channel.send("❎ **| I'm sorry, that vote option is invalid!**");

                let url = `https://api.tatsumaki.xyz/guilds/${message.guild.id}/members/${message.author.id}/stats`;
                request(url, {headers: {"Authorization": tatsukey}}, (err, response, data) => {
                    if (err) {
                        console.log(err);
                        return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from Tatsumaki's API. Please try again!**");
                    }
                    let user_stats = JSON.parse(data);
                    let user_score = parseInt(user_stats.score);
                    if (user_score < xp_req && !isEligible(message.member)) return message.channel.send(`❎ **| I'm sorry, you are not eligible enough to vote! You need at least \`${xp_req}\` Tatsu server XP unless you're a staff member!**`);

                    let i = 0;
                    let found = false;
                    for (i; i < choices.length; i++) {
                        if (!choices[i][2].includes(message.author.id)) continue;
                        if (i == choice) return message.channel.send("❎ **| I'm sorry, you've already voted for that option!**");
                        choices[i][2] = choices[i][2].filter(entry => entry != message.author.id);
                        --choices[i][1];
                        found = true;
                        break
                    }
                    ++choices[choice][1];
                    choices[choice][2].push(message.author.id);

                    let updateVal = {
                        $set: {
                            choices: choices
                        }
                    };

                    votedb.updateOne({channel: message.channel.id}, updateVal, err => {
                        if (err) {
                            console.log(err);
                            return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
                        }
                        message.channel.send(`✅ **| ${message.author}, ${!found ? "your vote has been registered" : `your vote has been moved from option \`${i+1}\` to \`${choice+1}\``}!**\n${voteStringProcessing(res.topic, choices)}`)
                    })
                })
            })
        }
    }
};

module.exports.config = {
    name: "vote",
    description: "Main voting command.",
    usage: "vote <option>\nvote check\nvote end\nvote start <topic> | <choice 1> | <choice 2> | <choice n> | ...",
    detail: "`choice n`: The vote's choices [Any]\n`option`: The vote option to vote for [Integer]\n`topic`: The vote's topic [String]",
    permission: "None"
};