var mongoose = require("mongoose");

var PostSchema = new mongoose.Schema({
    id_author: String,
    text: String,
    sub_text: String,
    color: String
}, {collection : 'post', versionKey: false});

var Post = mongoose.model('post', PostSchema);

module.exports = Post;