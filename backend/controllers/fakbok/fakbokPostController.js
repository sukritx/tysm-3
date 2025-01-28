const mongoose = require('mongoose');
const { fakbokPost } = require('../../models/fakbok/fakbokPost.model');
const { fakbokCommunity } = require('../../models/fakbok/fakbokCommunity.model');
const { fakbokComment } = require('../../models/fakbok/fakbokComment.model');
const { fileUpload } = require('../../middleware/file-upload');

// Create a new post
const createPost = [fileUpload({ fileType: 'image', maxSize: 5000000, destination: 'fakbok/posts' }), async (req, res) => {
    try {
        const { title, body, author_id, community_id, media_url } = req.body;
        const post = new fakbokPost({ 
            title, 
            body, 
            author_id, 
            community_id, 
            media_url,
            commentsCount: 0 
        });
        await post.save();
        res.status(201).json(post);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}];

// Get all posts with optional filters
const getAllPosts = async (req, res) => {
    try {
        const { sortBy } = req.query;
        const sortOptions = sortBy === 'upvotes' ? { upvotes: -1 } : { createdAt: -1 };
        
        // Get all posts
        const posts = await fakbokPost.find()
            .populate('author_id', 'username')
            .populate('community_id', 'name description')
            .sort(sortOptions);

        // Get comment counts for all posts
        const postsWithComments = await Promise.all(posts.map(async (post) => {
            const commentCount = await fakbokComment.countDocuments({ post_id: post._id });
            const postObj = post.toObject();
            postObj.commentsCount = commentCount;
            return postObj;
        }));

        res.json(postsWithComments);
    } catch (error) {
        console.error('Error in getAllPosts:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get all posts in a specific community
const getAllPostsInCommunity = async (req, res) => {
    try {
        const posts = await fakbokPost.find({ community_id: req.params.id })
            .populate('author_id', 'username')
            .populate('community_id', 'name description')
            .sort({ createdAt: -1 });

        // Get comment counts for all posts
        const postsWithComments = await Promise.all(posts.map(async (post) => {
            const commentCount = await fakbokComment.countDocuments({ post_id: post._id });
            const postObj = post.toObject();
            postObj.commentsCount = commentCount;
            return postObj;
        }));

        res.json(postsWithComments);
    } catch (error) {
        console.error('Error in getAllPostsInCommunity:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get a specific post by ID
const getPostById = async (req, res) => {
    try {
        const post = await fakbokPost.findById(req.params.id)
            .populate('author_id', 'username')
            .populate('community_id', 'name description');

        if (!post) return res.status(404).json({ error: 'Post not found' });

        // Get actual comment count
        const commentCount = await fakbokComment.countDocuments({ post_id: post._id });
        const postObj = post.toObject();
        postObj.commentsCount = commentCount;

        res.json(postObj);
    } catch (error) {
        console.error('Error in getPostById:', error);
        res.status(500).json({ error: error.message });
    }
};

// Update a post
const updatePost = async (req, res) => {
    try {
        const post = await fakbokPost.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!post) return res.status(404).json({ error: 'Post not found' });
        res.json(post);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete a post
const deletePost = async (req, res) => {
    try {
        const post = await fakbokPost.findByIdAndDelete(req.params.id);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        // Delete all comments associated with this post
        await fakbokComment.deleteMany({ post_id: req.params.id });
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Upvote a post
const upvotePost = async (req, res) => {
    try {
        const post = await fakbokPost.findById(req.params.id);
        if (!post) return res.status(404).json({ error: 'Post not found' });

        const userId = req.body.userId;

        // Check if user has already upvoted
        const hasUpvoted = post.upvotes.includes(userId);
        
        // Remove from downvotes if present
        post.downvotes = post.downvotes.filter(id => id.toString() !== userId);

        if (hasUpvoted) {
            // Remove upvote if already upvoted
            post.upvotes = post.upvotes.filter(id => id.toString() !== userId);
        } else {
            // Add upvote
            post.upvotes.push(userId);
        }

        await post.save();
        res.json(post);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Downvote a post
const downvotePost = async (req, res) => {
    try {
        const post = await fakbokPost.findById(req.params.id);
        if (!post) return res.status(404).json({ error: 'Post not found' });

        const userId = req.body.userId;

        // Check if user has already downvoted
        const hasDownvoted = post.downvotes.includes(userId);
        
        // Remove from upvotes if present
        post.upvotes = post.upvotes.filter(id => id.toString() !== userId);

        if (hasDownvoted) {
            // Remove downvote if already downvoted
            post.downvotes = post.downvotes.filter(id => id.toString() !== userId);
        } else {
            // Add downvote
            post.downvotes.push(userId);
        }

        await post.save();
        res.json(post);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createPost,
    getAllPosts,
    getAllPostsInCommunity,
    getPostById,
    updatePost,
    deletePost,
    upvotePost,
    downvotePost
};