const mongoose = require('mongoose');
const { fakbokComment } = require('../../models/fakbok/fakbokComment.model');
const { fakbokPost } = require('../../models/fakbok/fakbokPost.model');
const { User, Account } = require('../../models/user.model');

// Helper function to get author avatar
const getAuthorAvatar = async (authorId) => {
    const account = await Account.findOne({ userId: authorId }).select('avatar');
    return account?.avatar || null;
};

// Create a new comment
const createComment = async (req, res) => {
    try {
        const { body, author_id, post_id } = req.body;
        
        // Verify user exists and get their details
        const user = await User.findById(author_id);
        if (!user) {
            console.error('User not found:', author_id);
            return res.status(400).json({ error: 'Invalid user ID' });
        }
        console.log('Found user:', { id: user.id, username: user.username });

        // Create and save the comment
        const comment = new fakbokComment({
            body,
            author_id: user.id, // Use user.id consistently
            post_id,
            upvotes: [],
            downvotes: [],
            voteScore: 0
        });
        
        // Log the comment before saving
        console.log('Comment before save:', comment);
        
        await comment.save();
        console.log('Comment after save:', comment);

        // Update post's comment count
        await fakbokPost.findByIdAndUpdate(post_id, { $inc: { commentsCount: 1 } });

        // Populate author details
        await comment.populate('author_id', 'username email firstName lastName');

        // Get author's avatar
        const avatar = await getAuthorAvatar(author_id);
        const commentObj = comment.toObject();
        if (avatar) {
            commentObj.author_id.avatar = avatar;
        }

        res.status(201).json(commentObj);
    } catch (error) {
        console.error('Error in createComment:', error);
        res.status(400).json({ error: error.message });
    }
};

// Get all comments for a post
const getCommentsForPost = async (req, res) => {
    try {
        const comments = await fakbokComment.find({ post_id: req.params.postId })
            .populate('author_id', 'username email firstName lastName')
            .sort({ createdAt: -1 });

        // Get avatars for all comment authors
        const commentsWithAvatars = await Promise.all(comments.map(async (comment) => {
            const avatar = await getAuthorAvatar(comment.author_id._id);
            const commentObj = comment.toObject();
            if (avatar) {
                commentObj.author_id.avatar = avatar;
            }
            return commentObj;
        }));

        res.json(commentsWithAvatars);
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
        );
        
        if (!comment) return res.status(404).json({ error: 'Comment not found' });

        // Populate author details
        await comment.populate('author_id', 'username email firstName lastName');

        // Get author's avatar
        const avatar = await getAuthorAvatar(comment.author_id._id);
        const commentObj = comment.toObject();
        if (avatar) {
            commentObj.author_id.avatar = avatar;
        }

        res.json(commentObj);
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

// Vote on a comment
const voteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { userId, voteType } = req.body;

        const comment = await fakbokComment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        // Check current vote status
        const hasUpvoted = comment.upvotes.includes(userId);
        const hasDownvoted = comment.downvotes.includes(userId);

        // Remove any existing votes
        comment.upvotes = comment.upvotes.filter(id => id.toString() !== userId);
        comment.downvotes = comment.downvotes.filter(id => id.toString() !== userId);

        // Add new vote only if it's different from the current vote
        if (voteType === 'upvote' && !hasUpvoted) {
            comment.upvotes.push(userId);
        } else if (voteType === 'downvote' && !hasDownvoted) {
            comment.downvotes.push(userId);
        }
        // If voteType matches current vote or is 'none', we've already removed it

        // Update vote score
        comment.voteScore = comment.upvotes.length - comment.downvotes.length;

        await comment.save();

        // Populate author details
        await comment.populate('author_id', 'username email firstName lastName');

        // Get author's avatar
        const avatar = await getAuthorAvatar(comment.author_id._id);
        const commentObj = comment.toObject();
        if (avatar) {
            commentObj.author_id.avatar = avatar;
        }

        res.json(commentObj);
    } catch (error) {
        console.error('Error in voteComment:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createComment,
    getCommentsForPost,
    updateComment,
    deleteComment,
    voteComment
};