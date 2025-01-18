const mongoose = require("mongoose");

const fakbokCommentSchema = new mongoose.Schema({
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'fakbokPost', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true },
    upvotes:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    downvotes:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const fakbokComment = mongoose.model("fakbokComment", fakbokCommentSchema);

module.exports = {
    fakbokComment
};