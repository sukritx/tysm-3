const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');

router.post('/', commentController.createComment);
router.put('/:id', commentController.updateComment);
router.delete('/:id', commentController.deleteComment);
router.post('/:id/upvote', commentController.upvoteComment);
router.post('/:id/downvote', commentController.downvoteComment);
router.get('/post/:postId', commentController.getComments);

module.exports = router;