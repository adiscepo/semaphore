var mongoose = require("mongoose");

var CurrentBackgroundSchema = new mongoose.Schema({
    id_author: String,
    id_background: String
}, {collection : 'current_background', versionKey: false});

var CurrentBackground = mongoose.model('current_background', CurrentBackgroundSchema);

module.exports = CurrentBackground;