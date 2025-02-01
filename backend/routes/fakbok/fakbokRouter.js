const express = require('express');
const { createPost, getAllPosts, getAllPostsInCommunity, getPostById, updatePost, deletePost, upvotePost, downvotePost } = require('../../controllers/fakbok/fakbokPostController');
const { createComment, getCommentsForPost, updateComment, deleteComment, voteComment } = require('../../controllers/fakbok/fakbokCommentController');
const { 
    createCommunity, 
    getAllCommunities, 
    getCommunityById, 
    updateCommunity, 
    deleteCommunity, 
    joinCommunity, 
    leaveCommunity, 
    searchCommunities 
} = require('../../controllers/fakbok/fakbokCommunityController');
const { authMiddleware } = require('../../middleware/authMiddleware');
const { optionalAuthMiddleware } = require('../../middleware/optionalAuthMiddleware');

const router = express.Router();

// Community routes
router.get('/communities/search', searchCommunities);
router.get('/communities', optionalAuthMiddleware, getAllCommunities);
router.get('/communities/:id', optionalAuthMiddleware, getCommunityById);
router.post('/communities/create', authMiddleware, createCommunity);
router.put('/communities/:id', authMiddleware, updateCommunity);
router.delete('/communities/:id', authMiddleware, deleteCommunity);
router.post('/communities/:id/join', authMiddleware, joinCommunity);
router.post('/communities/:id/leave', authMiddleware, leaveCommunity);

// Post routes
router.post('/posts/create', authMiddleware, createPost);
router.get('/posts', getAllPosts);
router.get('/posts/community/:communityId', getAllPostsInCommunity);
router.get('/posts/:id', getPostById);
router.put('/posts/:id', authMiddleware, updatePost);
router.delete('/posts/:id', authMiddleware, deletePost);
router.post('/posts/:id/upvote', authMiddleware, upvotePost);
router.post('/posts/:id/downvote', authMiddleware, downvotePost);

// Comment routes
router.post('/posts/:postId/comments', authMiddleware, createComment);
router.get('/posts/:postId/comments', getCommentsForPost);
router.put('/comments/:id', authMiddleware, updateComment);
router.delete('/comments/:id', authMiddleware, deleteComment);
router.post('/comments/:commentId/vote', authMiddleware, voteComment);

module.exports = router;