const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const PostSchema = new mongoose.Schema({
    user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    heading:     { type: String, required: true },
    image:       { type: String }, // URL to the problem image
    examSession: { type: mongoose.Schema.Types.ObjectId, ref: 'ExamSession', required: false },
    upvotes:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Users who upvoted
    downvotes:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt:   { type: Date, default: Date.now },
    updatedAt:   { type: Date, default: Date.now },
}, { timestamps: true });

PostSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Post', PostSchema);
