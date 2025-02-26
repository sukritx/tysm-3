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
        const { sort } = req.query;
        let pipeline = [];

        // Add fields for vote calculations
        pipeline.push({
            $addFields: {
                score: {
                    $subtract: [
                        { $size: "$upvotes" },
                        { $size: "$downvotes" }
                    ]
                },
                timeDiff: {
                    $subtract: [new Date(), "$createdAt"]
                }
            }
        });

        // Add sorting based on option
        switch (sort) {
            case 'hot':
                pipeline.push({
                    $addFields: {
                        hotScore: {
                            $divide: [
                                "$score",
                                { $add: [1, { $divide: ["$timeDiff", 1000 * 60 * 60] }] } // Hours since creation
                            ]
                        }
                    }
                });
                pipeline.push({ $sort: { hotScore: -1 } });
                break;
            case 'top':
                pipeline.push({ $sort: { score: -1 } });
                break;
            case 'new':
            default:
                pipeline.push({ $sort: { createdAt: -1 } });
        }

        // Get all posts using aggregation
        const posts = await fakbokPost.aggregate(pipeline)
            .lookup({
                from: 'users',
                localField: 'author_id',
                foreignField: '_id',
                as: 'author'
            })
            .lookup({
                from: 'fakbokcommunities',
                localField: 'community_id',
                foreignField: '_id',
                as: 'community'
            })
            .unwind('author')
            .unwind('community');

        // Get comment counts and avatars for all posts
        const postsWithDetails = await Promise.all(posts.map(async (post) => {
            try {
                // Get comment count
                const commentCount = await fakbokComment.countDocuments({ post_id: post._id });
                post.commentsCount = commentCount;

                // Get avatar if author exists
                if (post.author && post.author._id) {
                    const avatar = await getAuthorAvatar(post.author._id);
                    if (avatar) {
                        post.author.avatar = avatar;
                    }
                }
            } catch (error) {
                console.error(`Error processing post ${post._id}:`, error);
                post.commentsCount = 0;
            }
            
            return post;
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
        const { sortBy = 'new' } = req.query;

        // First get all posts for the community
        const posts = await fakbokPost.find({ community_id: req.params.communityId })
            .populate('author_id', 'username email firstName lastName')
            .populate('community_id', 'name description');

        // Process posts with details and calculate scores
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

                // Calculate score and add timestamps for sorting
                postObj.score = (post.upvotes?.length || 0) - (post.downvotes?.length || 0);
                postObj.upvoteCount = post.upvotes?.length || 0;
                postObj.timestamp = new Date(post.createdAt).getTime();
                
                // For hot sorting: simple decay factor based on time
                const ageInHours = (Date.now() - postObj.timestamp) / (1000 * 60 * 60);
                postObj.hotScore = postObj.score / Math.pow(ageInHours + 2, 1.5);

            } catch (error) {
                console.error(`Error processing post ${post._id}:`, error);
                postObj.commentsCount = 0;
                postObj.score = 0;
                postObj.upvoteCount = 0;
                postObj.hotScore = 0;
            }
            
            return postObj;
        }));

        // Sort posts based on the selected option
        let sortedPosts;
        switch (sortBy) {
            case 'hot':
                // Sort by hot score (score with time decay)
                sortedPosts = postsWithDetails.sort((a, b) => b.hotScore - a.hotScore);
                break;
            case 'top':
                // Sort by total upvotes, then by newest
                sortedPosts = postsWithDetails.sort((a, b) => {
                    if (b.upvoteCount !== a.upvoteCount) {
                        return b.upvoteCount - a.upvoteCount;
                    }
                    return b.timestamp - a.timestamp;
                });
                break;
            case 'new':
            default:
                // Sort by timestamp (newest first)
                sortedPosts = postsWithDetails.sort((a, b) => b.timestamp - a.timestamp);
                break;
        }

        res.json(sortedPosts);
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