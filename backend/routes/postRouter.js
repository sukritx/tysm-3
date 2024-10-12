const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const postController = require('../controllers/postController');

router.get('/', postController.getPosts);
router.post('/', authMiddleware, postController.createPost);
router.get('/filter', postController.filterPosts);
router.get('/:id', postController.getPost);
//router.put('/:id', authMiddleware, postController.updatePost);
//router.delete('/:id', authMiddleware, postController.deletePost);
router.post('/:id/upvote', authMiddleware, postController.upvotePost);
router.post('/:id/downvote', authMiddleware, postController.downvotePost);
router.get('/:id/voting-history', authMiddleware, postController.getVotingHistory);

module.exports = router;