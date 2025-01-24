const mongoose = require("mongoose");

const fakbokCommentSchema = new mongoose.Schema({
    post_id: { type: mongoose.Schema.Types.ObjectId, ref: 'fakbokPost', required: true },
    author_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const fakbokComment = mongoose.model("fakbokComment", fakbokCommentSchema);

module.exports = {
    fakbokComment
};