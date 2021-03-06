function updateEntry(binddb, res, i, cb) {
    if (!res[i]) return cb(false, true);

    let updateVal = {
        $set: {
            previous_bind: [res[i].uid]
        }
    };

    binddb.updateOne({uid: res[i].uid}, updateVal, err => {
        if (err) {
            console.log(err);
            return cb(true);
        }
        cb()
    })
}

module.exports.run = (client, message, args, maindb) => {
    if (message.author.id != '132783516176875520' && message.author.id != '386742340968120321') return message.channel.send("❎ **| I'm sorry, you don't have the permission to use this. Please ask an Owner!**");

    let binddb = maindb.collection("userbind");
    binddb.find({}, { projection: {_id: 0, uid: 1} } ).toArray((err, res) => {
        if (err) {
            console.log(err);
            return message.channel.send("❎ **| I'm sorry, I'm having trouble receiving response from database. Please try again!**")
        }
        let i = 0;
        updateEntry(binddb, res, i, function nextEntry(error = false, stopSign = false) {
            if (stopSign) {
                console.log("Done!");
                return message.channel.send(`✅ **| ${message.author}, done!`)
            }
            console.log(i);
            if (!error) ++i;
            setTimeout(() => {
                updateEntry(binddb, res, i, nextEntry)
            }, 500)
        })
    })
};

module.exports.config = {
    name: "scanbind",
    description: "Scans bind database.",
    usage: "None",
    detail: "None",
    permission: "Specific person (<@132783516176875520> and <@386742340968120321>)"
};