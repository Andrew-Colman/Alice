const Discord = require('discord.js');
const config = require('../../config.json');
const osudroid = require('osu-droid');

module.exports.run = (client, message, args, maindb, alicedb, current_map) => {
    if (message.channel instanceof Discord.DMChannel) return;
    let channel_index = current_map.findIndex(map => map[0] === message.channel.id);
    if (channel_index === -1) return message.channel.send("❎ **| I'm sorry, there is no map being talked in the channel!**");
    let hash = current_map[channel_index][1];

    let ufind = message.author.id;
    if (args[0]) {
        ufind = args[0];
        ufind = ufind.replace("<@!", "").replace("<@", "").replace(">", "")
    }

    let binddb = maindb.collection("userbind");
    let query = {discordid: ufind};
    binddb.findOne(query, async function(err, res) {
        if (err) {
            console.log(err);
            return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
        }
        if (!res) return message.channel.send("❎ **| I'm sorry, the account is not binded. He/she/you need to use `a!userbind <uid>` first. To get uid, use `a!profilesearch <username>`.**");
        let uid = res.uid;

        const play = await new osudroid.PlayInfo().getFromHash({uid: uid, hash: hash});
        if (!play.title) return message.channel.send("❎ **| I'm sorry, you don't have scores set in the map!**")
        const name = play.player_name;
        const score = play.score.toLocaleString();
        const combo = play.combo;
        const rank = osudroid.rankImage.get(play.rank);
        const mod = play.mods;
        const acc = play.accuracy;
        const miss = play.miss;
        const date = play.date;
        const title = `${play.title} +${play.mods ? play.mods : "No Mod"}`;

        let n300, n100, n50;
        if (message.isOwner) {
            const score_data = await new osudroid.PlayInfo({uid: uid, hash: hash}).getFromHash();
            const data = await new osudroid.ReplayAnalyzer(score_data.score_id).analyze();
            n300 = data.data.hit300;
            n100 = data.data.hit100;
            n50 = data.data.hit50;
        }

        let rolecheck;
        try {
            rolecheck = message.member.roles.highest.hexColor
        } catch (e) {
            rolecheck = 8311585
        }
        const footer = config.avatar_list;
        const index = Math.floor(Math.random() * footer.length);
        const embed = new Discord.MessageEmbed()
            .setAuthor(title, player.avatarURL)
            .setColor(rolecheck)
            .setFooter(`Achieved on ${date.toUTCString()} | Alice Synthesis Thirty`, footer[index]);

        const mapinfo = await new osudroid.MapInfo().get({hash: hash});
        if (!mapinfo.title || !mapinfo.objects || !mapinfo.osu_file) {
            embed.setDescription(`▸ ${rank} ▸ ${acc}%\n‣ ${score} ▸ ${combo}x${n300 ? ` ▸ [${n300}/${n100}/${n50}/${miss}]` : ""}`);
            return message.channel.send(`✅ **| Comparison play for ${name}:**`, {embed: embed})
        }
        const star = new osudroid.MapStars().calculate({file: mapinfo.osu_file, mods: mod});
        const starsline = parseFloat(star.droid_stars.toString());
        const pcstarsline = parseFloat(star.pc_stars.toString());

        title = `${mapinfo.full_title} [${starsline}★ | ${pcstarsline}★] +${play.mods ? play.mods : "No Mod"}`;
        embed.setAuthor(title, player.avatarURL, `https://osu.ppy.sh/b/${mapinfo.beatmap_id}`)
            .setThumbnail(`https://b.ppy.sh/thumb/${mapinfo.beatmapset_id}l.jpg`);

        const npp = osudroid.ppv2({
            stars: star.droid_stars,
            combo: combo,
            acc_percent: acc,
            miss: miss,
            mode: "droid"
        });

        const pcpp = osudroid.ppv2({
            stars: star.pc_stars,
            combo: combo,
            acc_percent: acc,
            miss: miss,
            mode: "osu"
        });

        const ppline = parseFloat(npp.toString());
        const pcppline = parseFloat(pcpp.toString());

        if (miss > 0 || combo < mapinfo.max_combo) {
            const fc_acc = new osudroid.Accuracy({
                n300: (n300 ? n300 : npp.computed_accuracy.n300) + miss,
                n100: n100 ? n100 : npp.computed_accuracy.n100,
                n50 : n50 ? n50 : npp.computed_accuracy.n50,
                nmiss: 0,
                nobjects: mapinfo.objects
            }).value() * 100;

            const fc_dpp = osudroid.ppv2({
                stars: star.droid_stars,
                combo: mapinfo.max_combo,
                acc_percent: fc_acc,
                miss: 0,
                mode: "droid"
            });

            const fc_pp = osudroid.ppv2({
                stars: star.pc_stars,
                combo: mapinfo.max_combo,
                acc_percent: fc_acc,
                miss: 0,
                mode: "osu"
            });

            const dline = parseFloat(fc_dpp.toString());
            const pline = parseFloat(fc_pp.toString());

            embed.setDescription(`▸ ${rank} ▸ **${ppline}DPP** | **${pcppline}PP** (${dline}DPP, ${pline}PP for ${fc_acc.toFixed(2)}% FC) ▸ ${acc}%\n‣ ${score} ▸ ${combo}x/${mapinfo.max_combo}x${n300 ? ` ▸ [${n300}/${n100}/${n50}/${miss}]` : ""}`);
        } else embed.setDescription(`▸ ${rank} ▸ **${ppline}DPP** | **${pcppline}PP** ▸ ${acc}%\n‣ ${score} ▸ ${combo}x/${mapinfo.max_combo}x${n300 ? ` ▸ [${n300}/${n100}/${n50}/${miss}]` : ""}`);

        message.channel.send(`✅ **| Comparison play for ${name}:**`, {embed: embed})
    })
};

module.exports.config = {
    name: "c",
    description: "Compare your play amongst others.",
    usage: "c [user]",
    detail: "`user`: The user you want to compare [UserResolvable (mention or user ID)]",
    permission: "None"
};