const mongoose = require('mongoose');
const { fakbokPost } = require('../../models/fakbok/fakbokPost.model');
const { fakbokCommunity } = require('../../models/fakbok/fakbokCommunity.model');
const { fakbokComment } = require('../../models/fakbok/fakbokComment.model');
const { fileUpload } = require('../../middleware/file-upload');

// Create a new post
const createPost = [fileUpload({ fileType: 'image', maxSize: 5000000, destination: 'fakbok/posts' }), async (req, res) => {
    try {
        const { title, body, author_id, community_id, media_url } = req.body;
        const post = new fakbokPost({ title, body, author_id, community_id, media_url });
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
        const posts = await fakbokPost.find().sort(sortOptions);
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all posts in a specific community
const getAllPostsInCommunity = async (req, res) => {
    try {
        const posts = await fakbokPost.find({ community_id: req.params.id }).sort({ createdAt: -1 });
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get a specific post by ID
const getPostById = async (req, res) => {
    try {
        const post = await fakbokPost.findById(req.params.id)
            .populate('author_id', 'username') // Populate author username
            .populate('community_id', 'name description'); // Populate community details
        if (!post) return res.status(404).json({ error: 'Post not found' });
        res.json(post);
    } catch (error) {
        console.error('Error in getPostById:', error);
        res.status(500).json({ error: error.message });
    }
};

// Update a post
const updatePost = async (req, res) => {
    try {
        const { title, body, media, link } = req.body;
        const post = await fakbokPost.findByIdAndUpdate(req.params.id, { title, body, media, link }, { new: true });
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
        const upvoteIndex = post.upvotes.indexOf(userId);
        const downvoteIndex = post.downvotes.indexOf(userId);

        // Remove from downvotes if exists
        if (downvoteIndex !== -1) {
            post.downvotes.splice(downvoteIndex, 1);
        }

        // Toggle upvote
        if (upvoteIndex === -1) {
            post.upvotes.push(userId);
        } else {
            post.upvotes.splice(upvoteIndex, 1);
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
        const upvoteIndex = post.upvotes.indexOf(userId);
        const downvoteIndex = post.downvotes.indexOf(userId);

        // Remove from upvotes if exists
        if (upvoteIndex !== -1) {
            post.upvotes.splice(upvoteIndex, 1);
        }

        // Toggle downvote
        if (downvoteIndex === -1) {
            post.downvotes.push(userId);
        } else {
            post.downvotes.splice(downvoteIndex, 1);
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