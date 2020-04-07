const Discord = require('discord.js');
const config = require('../config.json');

function retrieveAuction(res, current_time, i, cb) {
    if (!res[i]) return cb(null, true);
    cb(res[i])
}

function checkClan(clandb, bids, j, cb) {
    if (!bids[j]) return cb(null, false, true);
    let name = bids[j][0];
    clandb.findOne({name: name}, (err, clanres) => {
        if (err) {
            console.log(err);
            cb(null, true)
        }
        if (clanres) cb(clanres);
        else cb()
    })
}

module.exports.run = (client, maindb, alicedb) => {
    let clandb = maindb.collection("clandb");
    let auctiondb = alicedb.collection("auction");
    let curtime = Math.floor(Date.now() / 1000);
    let coin = client.emojis.cache.get("669532330980802561");
    let auction_channel = client.channels.cache.get("696646867567640586");
    let updateVal;
    let footer = config.avatar_list;
    const index = Math.floor(Math.random() * footer.length);
    let embed = new Discord.MessageEmbed()
        .setTimestamp(new Date())
        .setFooter("Alice Synthesis Thirty", footer[index]);

    console.log("Checking auction expiry time");
    auctiondb.find({}).sort({expirydate: 1}).toArray((err, auctionres) => {
        if (err) return console.log(err);
        if (auctionres.length === 0) return;
        let i = 0;
        retrieveAuction(auctionres, curtime, i, function checkAuction(auction, stopSign = false) {
            if (stopSign || curtime < auction.expirydate) return console.log("Done checking auctions");
            let powerup = auction.powerup;
            let amount = auction.amount;
            let bids = auction.bids;

            let auction_info = `**Name**": ${auction.name}\n**Auctioneer**: ${auction.auctioneer}\n**Created at**: ${new Date(auction.creationdate * 1000).toUTCString()}\n**Minimum bid amount**: ${coin}**${auction.min_price.toLocaleString()}** Alice coins`;

            if (bids.length === 0) {
                clandb.findOne({name: auction.auctioneer}, (err, clanres) => {
                    if (err) {
                        console.log(err);
                        return retrieveAuction(auctionres, curtime, i, checkAuction)
                    }
                    if (!clanres) {
                        ++i;
                        return retrieveAuction(auctionres, curtime, i, checkAuction)
                    }
                    let powerups = clanres.powerups;
                    let powerup_index = powerups.findIndex(pow => pow[0] === powerup);
                    powerups[powerup_index][1] += amount;

                    auctiondb.deleteOne({auctioneer: auction.auctioneer}, err => {
                        if (err) {
                            console.log(err);
                            return retrieveAuction(auctionres, curtime, i, checkAuction)
                        }
                    });
                    updateVal = {
                        $set: {
                            powerups: powerups
                        }
                    };
                    clandb.updateOne({name: auction.auctioneer}, updateVal, err => {
                        if (err) {
                            console.log(err);
                            return retrieveAuction(auctionres, curtime, i, checkAuction)
                        }
                        embed.setColor('#cb3438').setTitle("Auction Information").setDescription(auction_info);
                        auction_channel.send(`❗**| ${auction.auctioneer}'s \`${auction.name}\` has ended! There are no bids put!**`, {embed: embed});
                        ++i;
                        retrieveAuction(auctionres, curtime, i, checkAuction)
                    })
                });
                return
            }

            let j = 0;
            checkClan(clandb, bids, j, function isClanAvailable(clan, error = false, stopFlag = false) {
                if (stopFlag) {
                    clandb.findOne({name: auction.auctioneer}, (err, clanres) => {
                        if (err) {
                            console.log(err);
                            return checkClan(clandb, bids, j, isClanAvailable)
                        }
                        if (!clanres) {
                            ++j;
                            return checkClan(clandb, bids, j, isClanAvailable)
                        }
                        let powerups = clanres.powerups;
                        let powerup_index = powerups.findIndex(pow => pow[0] === powerup);
                        powerups[powerup_index][1] += amount;

                        updateVal = {
                            $set: {
                                powerups: powerups
                            }
                        };
                        clandb.updateOne({name: auction.auctioneer}, updateVal, err => {
                            if (err) {
                                console.log(err);
                                return checkClan(clandb, bids, j, isClanAvailable)
                            }
                            let top_string = '';
                            for (let i = 0; i < 5; i++) {
                                if (bids[i]) top_string += `#${i+1}: ${bids[i][0]} - ${coin}**${bids[i][1]}** Alice coins\n`;
                                else top_string += `#${i+1}: -\n`
                            }
                            embed.setTitle("Auction Information")
                                .setDescription(auction_info)
                                .setColor('#cb9000')
                                .addField("**Auction Info**", `**Powerup**: ${powerup}\n**Amount**: ${amount}`)
                                .addField("**Bid Information**", `**Bidders**: ${bids.length}\n**Top bidders**:\n${top_string}`);
                            auction_channel.send(`❗**| ${auction.auctioneer}'s \`${auction.name}\` has ended! There are bids put, however all bidders were disbanded!**`, {embed: embed});
                            ++i;
                            retrieveAuction(auctionres, curtime, i, checkAuction)
                        })
                    });
                    return
                }
                if (!clan) {
                    if (!error) ++j;
                    return checkClan(clandb, bids, j, isClanAvailable)
                }
                let powerups = clan.powerups;
                let powerup_index = powerups.findIndex(pow => pow[0] === powerup);
                powerups[powerup_index][1] += amount;

                updateVal = {
                    $set: {
                        powerups: powerups
                    }
                };
                clandb.updateOne({name: clan.name}, updateVal, err => {
                    if (err) return console.log(err);
                });
                auctiondb.deleteOne({auctioneer: auction.auctioneer}, err => {
                    if (err) {
                        console.log(err);
                        return checkClan(clandb, bids, j, isClanAvailable)
                    }

                    let top_string = '';
                    for (let i = 0; i < 5; i++) {
                        if (bids[i]) top_string += `#${i+1}: ${bids[i][0]} - ${coin}**${bids[i][1]}** Alice coins\n`;
                        else top_string += `#${i+1}: -\n`
                    }
                    if (j > 4) top_string += `${'.\n'.repeat(Math.min(j - 4, 3))}#${j + 1}: ${clan.name} - ${coin}**${bids[j][1]}** Alice coins`;

                    embed.setTitle("Auction Information")
                        .setDescription(auction_info)
                        .setColor('#25cb19')
                        .addField("**Auction Info**", `**Powerup**: ${powerup}\n**Amount**: ${amount}`)
                        .addField("Bid Information", `**Bidders**: ${bids.length}\n**Winning bidder**: ${clan.name}\n\n**Top bidders**:\n${top_string}`);

                    auction_channel.send(`❗**| ${auction.auctioneer}'s \`${auction.name}\` has ended! ${j > 0 ? `Unfortunately, the top ${j} bidders were not available or disbanded. ` : ""}\`${clan.name}\` wins the auction!**`, {embed: embed});
                    ++i;
                    retrieveAuction(auctionres, curtime, i, checkAuction)
                })
            })
        })
    })
};

module.exports.config = {
    name: 'auctiontrack'
};