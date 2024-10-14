const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const commentController = require('../controllers/commentController');

router.post('/', authMiddleware, commentController.createComment);
//router.put('/:id', commentController.updateComment);
//router.delete('/:id', commentController.deleteComment);
router.post('/:id/upvote', authMiddleware, commentController.upvoteComment);
router.post('/:id/downvote', authMiddleware, commentController.downvoteComment);
router.get('/post/:postId', commentController.getComments);

module.exports = router;
