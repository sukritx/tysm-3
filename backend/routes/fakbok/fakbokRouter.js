const express = require('express');
const { createPost, getAllPosts, getPostById, updatePost, deletePost, upvotePost, downvotePost } = require('../../controllers/fakbok/fakbokPostController');
const { createComment, getCommentsForPost, updateComment, deleteComment, upvoteComment, downvoteComment } = require('../../controllers/fakbok/fakbokCommentController');
const { createCommunity, getAllCommunities, getCommunityById, updateCommunity, deleteCommunity, followCommunity, unfollowCommunity } = require('../../controllers/fakbok/fakbokCommunityController');

const router = express.Router();

// Post routes
router.post('/posts/create', createPost);
router.get('/posts', getAllPosts);
router.get('/posts/:id', getPostById);
router.put('/posts/:id', updatePost);
router.delete('/posts/:id', deletePost);
router.post('/posts/:id/upvote', upvotePost);
router.post('/posts/:id/downvote', downvotePost);

// Comment routes
router.post('/comments/create', createComment);
router.get('/comments/post/:postId', getCommentsForPost);
router.put('/comments/:id', updateComment);
router.delete('/comments/:id', deleteComment);
router.post('/comments/:id/upvote', upvoteComment);
router.post('/comments/:id/downvote', downvoteComment);

// Community routes
router.post('/communities/create', createCommunity);
router.get('/communities', getAllCommunities);
router.get('/communities/:id', getCommunityById);
router.put('/communities/:id', updateCommunity);
router.delete('/communities/:id', deleteCommunity);
router.post('/communities/:id/follow', followCommunity);
router.post('/communities/:id/unfollow', unfollowCommunity);

module.exports = router;