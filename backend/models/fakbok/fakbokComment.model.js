const mongoose = require("mongoose");

const fakbokCommentSchema = new mongoose.Schema({
    post_id: { type: mongoose.Schema.Types.ObjectId, ref: 'fakbokPost', required: true },
    author_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    voteScore: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

const fakbokComment = mongoose.model("fakbokComment", fakbokCommentSchema);

module.exports = {
    fakbokComment
};