const Comment = require('../models/Comment');
const Post = require('../models/Post');
const User = require('../models/User');
const { notificationController } = require('./notificationController');

exports.createComment = async (req, res) => {
  try {
    const { postId, text, image } = req.body;
    const userId = req.userId; // Assuming you have middleware that sets userId

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const newComment = new Comment({
      user: userId,
      post: postId,
      text,
      image
    });

    const savedComment = await newComment.save();

    // Send notification to post author
    if (post.user.toString() !== userId) {
      await notificationController.sendCommentNotification(post.user, userId, postId, savedComment._id);
    }

    // Check for mentions in the comment text
    const mentionRegex = /@(\w+)/g;
    const mentions = text.match(mentionRegex);

    if (mentions) {
      for (const mention of mentions) {
        const username = mention.slice(1); // Remove the @ symbol
        const mentionedUser = await User.findOne({ username });
        
        if (mentionedUser && mentionedUser._id.toString() !== userId) {
          await notificationController.sendMentionNotification(mentionedUser._id, userId, postId, savedComment._id);
        }
      }
    }

    res.status(201).json(savedComment);
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, image } = req.body;
    const userId = req.userId;

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.user.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to update this comment" });
    }

    comment.text = text || comment.text;
    comment.image = image || comment.image;

    const updatedComment = await comment.save();
    res.status(200).json(updatedComment);
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.user.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to delete this comment" });
    }

    await comment.remove();
    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

exports.upvoteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.upvotes.includes(userId)) {
      comment.upvotes = comment.upvotes.filter(id => id.toString() !== userId);
    } else {
      comment.upvotes.push(userId);
      comment.downvotes = comment.downvotes.filter(id => id.toString() !== userId);
    }

    const updatedComment = await comment.save();
    res.status(200).json(updatedComment);
  } catch (error) {
    console.error("Error upvoting comment:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

exports.downvoteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.downvotes.includes(userId)) {
      comment.downvotes = comment.downvotes.filter(id => id.toString() !== userId);
    } else {
      comment.downvotes.push(userId);
      comment.upvotes = comment.upvotes.filter(id => id.toString() !== userId);
    }

    const updatedComment = await comment.save();
    res.status(200).json(updatedComment);
  } catch (error) {
    console.error("Error downvoting comment:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

exports.getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ post: postId })
      .populate('user', 'username')
      .sort({ createdAt: -1 });

    res.status(200).json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};