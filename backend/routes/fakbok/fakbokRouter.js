const express = require('express');
const { createPost, getAllPosts, getAllPostsInCommunity, getPostById, updatePost, deletePost, upvotePost, downvotePost } = require('../../controllers/fakbok/fakbokPostController');
const { createComment, getCommentsForPost, updateComment, deleteComment, upvoteComment, downvoteComment } = require('../../controllers/fakbok/fakbokCommentController');
const { createCommunity, getAllCommunities, getCommunityById, updateCommunity, deleteCommunity, followCommunity, unfollowCommunity, joinCommunity, leaveCommunity } = require('../../controllers/fakbok/fakbokCommunityController');

const router = express.Router();

// Community routes
router.post('/communities/create', createCommunity);
router.get('/communities', getAllCommunities);
router.get('/communities/:id', getCommunityById);
router.put('/communities/:id/update', updateCommunity);
router.delete('/communities/:id/delete', deleteCommunity);

// Post routes
router.post('/posts/create', createPost);
router.get('/posts', getAllPosts);
router.get('/posts/community/:id', getAllPostsInCommunity);
router.get('/posts/:id', getPostById);
router.put('/posts/:id/update', updatePost);
router.delete('/posts/:id/delete', deletePost);
router.post('/posts/:id/upvote', upvotePost);
router.post('/posts/:id/downvote', downvotePost);

// Comment routes
router.post('/comments/create', createComment);
router.get('/comments/post/:postId', getCommentsForPost);
router.put('/comments/:id/update', updateComment);
router.delete('/comments/:id/delete', deleteComment);
router.post('/comments/:id/upvote', upvoteComment);
router.post('/comments/:id/downvote', downvoteComment);

module.exports = router;