var mongoose = require("mongoose");

var BackgroundSchema = new mongoose.Schema({
    id_author: String,
    path: String
}, {collection : 'background', versionKey: false});

var Background = mongoose.model('background', BackgroundSchema);

module.exports = Background;