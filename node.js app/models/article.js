var mongoose = require("mongoose");

var articleSchema = new mongoose.Schema({
    title: String,
    imageCover: String,
    description: String,
    htmlContent: String,
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    creationDate: Date
});

module.exports = mongoose.model("Article", articleSchema);