const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const commentController = require('../controllers/commentController');

router.post('/', authMiddleware, commentController.createComment);
//router.put('/:id', commentController.updateComment);
//router.delete('/:id', commentController.deleteComment);
router.post('/:id/upvote', authMiddleware, commentController.upvoteComment);
router.post('/:id/downvote', authMiddleware, commentController.downvoteComment);
router.get('/post/:postId', authMiddleware, commentController.getComments);
router.get('/post/:postId/public', commentController.getPublicComments);

module.exports = router;
