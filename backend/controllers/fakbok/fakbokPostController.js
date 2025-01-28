const mongoose = require('mongoose');
const { fakbokPost } = require('../../models/fakbok/fakbokPost.model');
const { fakbokCommunity } = require('../../models/fakbok/fakbokCommunity.model');
const { fakbokComment } = require('../../models/fakbok/fakbokComment.model');
const { Account } = require('../../models/user.model');
const { fileUpload } = require('../../middleware/file-upload');

// Helper function to get author avatar
const getAuthorAvatar = async (authorId) => {
    const account = await Account.findOne({ userId: authorId }).select('avatar');
    return account?.avatar || null;
};

// Create a new post
const createPost = [fileUpload({ fileType: 'image', maxSize: 5000000, destination: 'fakbok/posts' }), async (req, res) => {
    try {
        const { title, body, author_id, community_id, media_url } = req.body;

        // Create and save the post
        const post = new fakbokPost({ 
            title, 
            body, 
            author_id, 
            community_id, 
            media_url,
            commentsCount: 0,
            upvotes: [],
            downvotes: []
        });
        
        await post.save();

        // Populate author and community details
        await post.populate([
            {
                path: 'author_id',
                select: 'username email firstName lastName'
            },
            {
                path: 'community_id',
                select: 'name description'
            }
        ]);

        // Get author's avatar
        const avatar = await getAuthorAvatar(author_id);
        const postObj = post.toObject();
        if (avatar) {
            postObj.author_id.avatar = avatar;
        }

        res.status(201).json(postObj);
    } catch (error) {
        console.error('Error in createPost:', error);
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
            .populate('author_id', 'username email firstName lastName')
            .populate('community_id', 'name description')
            .sort(sortOptions);

        // Get comment counts and avatars for all posts
        const postsWithDetails = await Promise.all(posts.map(async (post) => {
            const postObj = post.toObject();
            
            try {
                // Get comment count
                const commentCount = await fakbokComment.countDocuments({ post_id: post._id });
                postObj.commentsCount = commentCount;

                // Get avatar only if author_id exists
                if (postObj.author_id && postObj.author_id._id) {
                    const avatar = await getAuthorAvatar(postObj.author_id._id);
                    if (avatar) {
                        postObj.author_id.avatar = avatar;
                    }
                }
            } catch (error) {
                console.error(`Error processing post ${post._id}:`, error);
                // Set default values if there's an error
                postObj.commentsCount = 0;
            }
            
            return postObj;
        }));

        res.json(postsWithDetails);
    } catch (error) {
        console.error('Error in getAllPosts:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get all posts in a specific community
const getAllPostsInCommunity = async (req, res) => {
    try {
        const posts = await fakbokPost.find({ community_id: req.params.id })
            .populate('author_id', 'username email firstName lastName')
            .populate('community_id', 'name description')
            .sort({ createdAt: -1 });

        // Get comment counts and avatars for all posts
        const postsWithDetails = await Promise.all(posts.map(async (post) => {
            const postObj = post.toObject();
            
            try {
                // Get comment count
                const commentCount = await fakbokComment.countDocuments({ post_id: post._id });
                postObj.commentsCount = commentCount;

                // Get avatar only if author_id exists
                if (postObj.author_id && postObj.author_id._id) {
                    const avatar = await getAuthorAvatar(postObj.author_id._id);
                    if (avatar) {
                        postObj.author_id.avatar = avatar;
                    }
                }
            } catch (error) {
                console.error(`Error processing post ${post._id}:`, error);
                // Set default values if there's an error
                postObj.commentsCount = 0;
            }
            
            return postObj;
        }));

        res.json(postsWithDetails);
    } catch (error) {
        console.error('Error in getAllPostsInCommunity:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get a specific post by ID
const getPostById = async (req, res) => {
    try {
        const post = await fakbokPost.findById(req.params.id)
            .populate('author_id', 'username email firstName lastName')
            .populate('community_id', 'name description');

        if (!post) return res.status(404).json({ error: 'Post not found' });

        const postObj = post.toObject();
        
        try {
            // Get comment count
            const commentCount = await fakbokComment.countDocuments({ post_id: post._id });
            postObj.commentsCount = commentCount;

            // Get avatar only if author_id exists
            if (postObj.author_id && postObj.author_id._id) {
                const avatar = await getAuthorAvatar(postObj.author_id._id);
                if (avatar) {
                    postObj.author_id.avatar = avatar;
                }
            }
        } catch (error) {
            console.error(`Error processing post ${post._id}:`, error);
            // Set default values if there's an error
            postObj.commentsCount = 0;
        }

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
        ).populate('author_id', 'username email firstName lastName')
         .populate('community_id', 'name description');

        if (!post) return res.status(404).json({ error: 'Post not found' });

        // Get author's avatar
        const avatar = await getAuthorAvatar(post.author_id._id);
        const postObj = post.toObject();
        if (avatar) {
            postObj.author_id.avatar = avatar;
        }

        res.json(postObj);
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
        await post.populate('author_id', 'username email firstName lastName');
        
        // Get author's avatar
        const avatar = await getAuthorAvatar(post.author_id._id);
        const postObj = post.toObject();
        if (avatar) {
            postObj.author_id.avatar = avatar;
        }

        res.json(postObj);
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
        await post.populate('author_id', 'username email firstName lastName');
        
        // Get author's avatar
        const avatar = await getAuthorAvatar(post.author_id._id);
        const postObj = post.toObject();
        if (avatar) {
            postObj.author_id.avatar = avatar;
        }

        res.json(postObj);
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