const express = require('express');
const { createPost, getAllPosts, getAllPostsInCommunity, getPostById, updatePost, deletePost, upvotePost, downvotePost } = require('../../controllers/fakbok/fakbokPostController');
const { createComment, getCommentsForPost, updateComment, deleteComment, upvoteComment, downvoteComment } = require('../../controllers/fakbok/fakbokCommentController');
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

const router = express.Router();

// Community routes
router.get('/communities/search', searchCommunities);
router.get('/communities', getAllCommunities);
router.get('/communities/:id', getCommunityById);
router.post('/communities/create', createCommunity);
router.put('/communities/:id', updateCommunity);
router.delete('/communities/:id', deleteCommunity);
router.post('/communities/:id/join', joinCommunity);
router.post('/communities/:id/leave', leaveCommunity);

// Post routes
router.post('/posts/create', createPost);
router.get('/posts', getAllPosts);
router.get('/posts/community/:communityId', getAllPostsInCommunity);
router.get('/posts/:id', getPostById);
router.put('/posts/:id', updatePost);
router.delete('/posts/:id', deletePost);
router.post('/posts/:id/upvote', upvotePost);
router.post('/posts/:id/downvote', downvotePost);

// Comment routes
router.post('/posts/:postId/comments', createComment);
router.get('/posts/:postId/comments', getCommentsForPost);
router.put('/comments/:id', updateComment);
router.delete('/comments/:id', deleteComment);
router.post('/comments/:id/upvote', upvoteComment);
router.post('/comments/:id/downvote', downvoteComment);

module.exports = router;