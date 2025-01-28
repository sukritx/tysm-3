const mongoose = require("mongoose");

const fakbokPostSchema = new mongoose.Schema({
    title: { type: String, required: true },
    body: { type: String, required: true },
    media_url: { type: String },
    author_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    community_id: { type: mongoose.Schema.Types.ObjectId, ref: 'fakbokCommunity', required: true },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    commentsCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const fakbokPost = mongoose.model("fakbokPost", fakbokPostSchema);

module.exports = {
    fakbokPost
};