const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const postController = require('../controllers/postController');

router.get('/public', postController.getPublicPosts);
router.get('/authenticated', authMiddleware, postController.getAuthenticatedPosts);
router.post('/', authMiddleware, postController.createPost);
router.get('/filter', postController.filterPosts);
router.get('/:id', authMiddleware, postController.getPost);
//router.put('/:id', authMiddleware, postController.updatePost);
//router.delete('/:id', authMiddleware, postController.deletePost);
router.post('/:id/upvote', authMiddleware, postController.upvotePost);
router.post('/:id/downvote', authMiddleware, postController.downvotePost);
router.get('/:id/voting-history', authMiddleware, postController.getVotingHistory);
router.get('/:id/public', postController.getPublicPost);

module.exports = router;
