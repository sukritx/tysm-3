const mongoose = require('mongoose');
const { fakbokComment } = require('../../models/fakbok/fakbokComment.model');
const { fakbokPost } = require('../../models/fakbok/fakbokPost.model');

// Create a new comment
const createComment = async (req, res) => {
    try {
        const { postId, author, body } = req.body;
        const comment = new fakbokComment({ postId, author, body });
        await comment.save();
        await fakbokPost.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });
        res.status(201).json(comment);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get all comments for a post
const getCommentsForPost = async (req, res) => {
    try {
        const comments = await fakbokComment.find({ postId: req.params.postId });
        res.json(comments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update a comment
const updateComment = async (req, res) => {
    try {
        const { body } = req.body;
        const comment = await fakbokComment.findByIdAndUpdate(req.params.id, { body }, { new: true });
        if (!comment) return res.status(404).json({ error: 'Comment not found' });
        res.json(comment);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete a comment
const deleteComment = async (req, res) => {
    try {
        const comment = await fakbokComment.findByIdAndDelete(req.params.id);
        if (!comment) return res.status(404).json({ error: 'Comment not found' });
        await fakbokPost.findByIdAndUpdate(comment.postId, { $inc: { commentsCount: -1 } });
        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Upvote a comment
const upvoteComment = async (req, res) => {
    try {
        const comment = await fakbokComment.findById(req.params.id);
        if (!comment) return res.status(404).json({ error: 'Comment not found' });
        comment.upvotes.push(req.body.userId);
        await comment.save();
        res.json(comment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Downvote a comment
const downvoteComment = async (req, res) => {
    try {
        const comment = await fakbokComment.findById(req.params.id);
        if (!comment) return res.status(404).json({ error: 'Comment not found' });
        comment.downvotes.push(req.body.userId);
        await comment.save();
        res.json(comment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createComment,
    getCommentsForPost,
    updateComment,
    deleteComment,
    upvoteComment,
    downvoteComment
};