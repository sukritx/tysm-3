const mongoose = require("mongoose");

const fakbokPostSchema = new mongoose.Schema({
    title: { type: String, required: true },
    body: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', required: true },
    media: [{ type: String }], // Array of media URLs or file paths
    link: { type: String }, // Optional external link
    upvotes:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    downvotes:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    commentsCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const fakbokPost = mongoose.model("fakbokPost", fakbokPostSchema);

module.exports = {
    fakbokPost
};