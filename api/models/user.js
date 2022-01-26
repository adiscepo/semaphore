var mongoose = require("mongoose");

var UserSchema = new mongoose.Schema({
    name: String,
    passwd: String
}, {collection : 'user', versionKey: false});

var User = mongoose.model('user', UserSchema);

module.exports = User;
