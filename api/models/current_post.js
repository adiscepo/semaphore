var mongoose = require("mongoose");

var CurrentPostSchema = new mongoose.Schema({
    id_author: String,
    id_post: String
}, {collection : 'current_post', versionKey: false});

var CurrentPost = mongoose.model('current_post', CurrentPostSchema);

module.exports = CurrentPost;