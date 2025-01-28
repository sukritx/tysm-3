const mongoose = require('mongoose');
const { fakbokComment } = require('../../models/fakbok/fakbokComment.model');
const { fakbokPost } = require('../../models/fakbok/fakbokPost.model');

// Create a new comment
const createComment = async (req, res) => {
    try {
        const { body, author_id, post_id } = req.body;
        const comment = new fakbokComment({ body, author_id, post_id });
        await comment.save();

        // Update post's comment count
        await fakbokPost.findByIdAndUpdate(post_id, { $inc: { commentsCount: 1 } });

        // Populate author details before sending response
        await comment.populate('author_id', 'username');
        res.status(201).json(comment);
    } catch (error) {
        console.error('Error in createComment:', error);
        res.status(400).json({ error: error.message });
    }
};

// Get all comments for a post
const getCommentsForPost = async (req, res) => {
    try {
        const comments = await fakbokComment.find({ post_id: req.params.postId })
            .populate('author_id', 'username')
            .sort({ createdAt: -1 });
        res.json(comments);
    } catch (error) {
        console.error('Error in getCommentsForPost:', error);
        res.status(500).json({ error: error.message });
    }
};

// Update a comment
const updateComment = async (req, res) => {
    try {
        const { body } = req.body;
        const comment = await fakbokComment.findByIdAndUpdate(
            req.params.id,
            { body },
            { new: true }
        ).populate('author_id', 'username');
        
        if (!comment) return res.status(404).json({ error: 'Comment not found' });
        res.json(comment);
    } catch (error) {
        console.error('Error in updateComment:', error);
        res.status(500).json({ error: error.message });
    }
};

// Delete a comment
const deleteComment = async (req, res) => {
    try {
        const comment = await fakbokComment.findById(req.params.id);
        if (!comment) return res.status(404).json({ error: 'Comment not found' });

        // Decrement post's comment count
        await fakbokPost.findByIdAndUpdate(comment.post_id, { $inc: { commentsCount: -1 } });

        await comment.deleteOne();
        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Error in deleteComment:', error);
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
        console.error('Error in upvoteComment:', error);
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
        console.error('Error in downvoteComment:', error);
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