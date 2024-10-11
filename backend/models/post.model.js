const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    heading:     { type: String, required: true },
    image:       { type: String }, // URL to the problem image
    examSession: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamSession', required: true },
    upvotes:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Users who upvoted
    downvotes:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt:   { type: Date, default: Date.now },
  });
  
  module.exports = mongoose.model('Post', PostSchema);
  