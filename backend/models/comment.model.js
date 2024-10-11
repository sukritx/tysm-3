const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    post:      { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    text:      { type: String }, // Optional text content
    image:     { type: String }, // Optional image URL
    upvotes:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Users who upvoted
    downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now },
  });
  
  module.exports = mongoose.model('Comment', CommentSchema);
  