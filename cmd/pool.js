var fs = require('fs');

module.exports.run = (client, message, args) => {
    let filepath = "./pool/" + args[0] + ".png";
    fs.readFile(filepath, err => {
        message.channel.send(err?"❎ **| I'm sorry, that pool does not exist!**": {file: filepath})
    })
};

module.exports.config = {
    description: "Views the pool of a tournament.",
    usage: "pool <pool id>",
    detail: "`pool id`: The ID of the pool",
    permission: "None"
};

module.exports.help = {
    name: "pool"
};