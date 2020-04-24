const Discord = require('discord.js');
const config = require('../../config.json');
const osudroid = require('../../modules/osu!droid');

function levelBar(levelprogress) {
    let barcount = 15;
    let progress = Math.floor(parseFloat(levelprogress.toFixed(2)) / (100 / barcount));
    return "🟢".repeat(Math.min(5, progress)) + "🟡".repeat(Math.min(5, Math.max(0, progress - 5))) + "🔴".repeat(Math.min(5, Math.max(0, progress - 10))) + "⚪".repeat(barcount - progress)
}

module.exports.run = (client, message, args, maindb, alicedb) => {
    let ufind = message.author.id;
    if (args[0]) {
        ufind = args[0];
        ufind = ufind.replace("<@!", "").replace("<@", "").replace(">", "")
    }
    let binddb = maindb.collection("userbind");
    let scoredb = alicedb.collection("playerscore");
    let query = {discordid: ufind};
    binddb.findOne(query, (err, userres) => {
        if (err) {
            console.log(err);
            return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
        }
        if (!userres) return message.channel.send("❎ **| I'm sorry, the account is not binded. He/she/you must use `a!userbind <uid>` first. To get uid, use `a!profilesearch <username>`.**");
        let uid = userres.uid;
        let username = userres.username;

        query = {uid: uid};
        scoredb.findOne(query, async (err, res) => {
            if (err) {
                console.log(err);
                return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
            }
            let score = 0;
            let level = 1;
            let playc = 0;
            if (res) {
                score = res.score;
                level = res.level;
                playc = res.playc
            }
            let levelremain = (level - Math.floor(level)) * 100;
            const player = await new osudroid.PlayerInfo().get(query).catch(console.error);
            if (!player.name) return message.channel.send("❎ **| I'm sorry, I cannot find the user info!**");
            let avalink = player.avatarURL;
            let rolecheck;
            try {
                rolecheck = message.member.roles.highest.hexColor
            } catch (e) {
                rolecheck = "#000000"
            }
            let footer = config.avatar_list;
            const index = Math.floor(Math.random() * footer.length);
            let embed = new Discord.MessageEmbed()
                .setColor(rolecheck)
                .setThumbnail(avalink)
                .setAuthor(`Level profile for ${username}`, "https://image.frl/p/beyefgeq5m7tobjg.jpg", `http://ops.dgsrz.com/profile.php?uid=${uid}.html`)
                .setFooter("Alice Synthesis Thirty", footer[index])
                .setDescription(`**Total Ranked Score:** ${score.toLocaleString()}\n**Play Count:** ${playc}\n**Level:** ${Math.floor(level)} (${levelremain.toFixed(2)}%)\n\n**Level Progress**\n${levelBar(levelremain)}`);

            message.channel.send({embed: embed}).catch(console.error)
        })
    })
};

module.exports.config = {
    name: "levelme",
    description: "Views a user's ranked score profile.",
    usage: "levelme [user]",
    detail: "`user`: The user to view [UserResolvable (mention or user ID)]",
    permission: "None"
};