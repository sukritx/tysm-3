const express = require('express');
const router = express.Router();
const postController = require('../../../controllers/api/v2/postController');

router.get('/', postController.getPosts);
router.post('/', postController.createPost);
router.get('/:id', postController.getPost);
router.put('/:id', postController.updatePost);
router.delete('/:id', postController.deletePost);
router.post('/:id/upvote', postController.upvotePost);
router.post('/:id/downvote', postController.downvotePost);
router.get('/:id/voting-history', postController.getVotingHistory);
router.get('/filter', postController.filterPosts);

module.exports = router;