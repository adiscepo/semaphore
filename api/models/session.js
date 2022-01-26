var mongoose = require("mongoose");

var SessionSchema = new mongoose.Schema({
    id_user: String,
    secret: String
}, {collection : 'active_session', versionKey: false});

var session = mongoose.model('active_session', SessionSchema);

module.exports = session;
