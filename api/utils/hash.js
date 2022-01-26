const crypto = require('crypto'); // Hash des mots de passe

function hash(string) {
    return crypto.createHash('sha1').update(string).digest("hex"); // On hash le mot de passe
}

module.exports = hash;