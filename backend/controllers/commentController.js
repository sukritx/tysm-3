const Comment = require('../models/comment.model');
const Post = require('../models/post.model');
const { User, Account } = require('../models/user.model');  // Change this line
const { notificationController } = require('./notificationController');
const { fileUpload } = require('../middleware/file-upload');
const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
require('dotenv').config()

const s3Client = new S3Client({
    endpoint: process.env.DO_SPACES_ENDPOINT,
    region: process.env.DO_SPACES_REGION,
    credentials: {
      accessKeyId: process.env.DO_SPACES_KEY,
      secretAccessKey: process.env.DO_SPACES_SECRET
    },
    forcePathStyle: true
  });

exports.createComment = async (req, res) => {
  const upload = fileUpload({ destination: 'comments' });

  upload(req, res, async function(err) {
    if (err) {
      console.error("Error uploading file:", err);
      return res.status(500).json({ error: "Error uploading file", details: err.message });
    }

    try {
      const { postId, text } = req.body;
      const userId = req.user._id;

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      let imageUrl = null;
      if (req.file) {
        imageUrl = req.file.location;
      }

      const newComment = new Comment({
        user: userId,
        post: postId,
        text,
        image: imageUrl
      });

      const savedComment = await newComment.save();

      // Send notification to post author
      if (post.user.toString() !== userId.toString()) {
        await notificationController.sendCommentNotification(post.user, userId, postId, savedComment._id);
      }

      // Check for mentions in the comment text
      const mentionRegex = /@(\w+)/g;
      const mentions = text.match(mentionRegex);

      if (mentions) {
        for (const mention of mentions) {
          const username = mention.slice(1); // Remove the @ symbol
          const mentionedUser = await User.findOne({ username });
          
          if (mentionedUser && mentionedUser._id.toString() !== userId.toString()) {
            await notificationController.sendMentionNotification(mentionedUser._id, userId, postId, savedComment._id);
          }
        }
      }

      // Populate user data
      await savedComment.populate('user', 'username');
      
      // Fetch user's avatar
      const account = await Account.findOne({ userId: savedComment.user._id }, 'avatar');
      
      const commentWithAvatar = savedComment.toObject();
      commentWithAvatar.user.avatar = account?.avatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';

      res.status(201).json(commentWithAvatar);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  });
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

    const comment = await Comment.findById(id).populate('user', 'username');

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const upvoteIndex = comment.upvotes.indexOf(userId);
    const downvoteIndex = comment.downvotes.indexOf(userId);

    if (upvoteIndex > -1) {
      // User has already upvoted, so remove the upvote
      comment.upvotes.splice(upvoteIndex, 1);
    } else {
      // Add upvote
      comment.upvotes.push(userId);
      // Remove downvote if exists
      if (downvoteIndex > -1) {
        comment.downvotes.splice(downvoteIndex, 1);
      }
    }

    await comment.save();

    const updatedComment = comment.toObject();
    updatedComment.userVoteStatus = {
      upvoted: comment.upvotes.includes(userId),
      downvoted: comment.downvotes.includes(userId)
    };
    updatedComment.upvotesCount = comment.upvotes.length;
    updatedComment.downvotesCount = comment.downvotes.length;

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

    const comment = await Comment.findById(id).populate('user', 'username');

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const downvoteIndex = comment.downvotes.indexOf(userId);
    const upvoteIndex = comment.upvotes.indexOf(userId);

    if (downvoteIndex > -1) {
      // User has already downvoted, so remove the downvote
      comment.downvotes.splice(downvoteIndex, 1);
    } else {
      // Add downvote
      comment.downvotes.push(userId);
      // Remove upvote if exists
      if (upvoteIndex > -1) {
        comment.upvotes.splice(upvoteIndex, 1);
      }
    }

    await comment.save();

    const updatedComment = comment.toObject();
    updatedComment.userVoteStatus = {
      upvoted: comment.upvotes.includes(userId),
      downvoted: comment.downvotes.includes(userId)
    };
    updatedComment.upvotesCount = comment.upvotes.length;
    updatedComment.downvotesCount = comment.downvotes.length;

    res.status(200).json(updatedComment);
  } catch (error) {
    console.error("Error downvoting comment:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

exports.getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId; // This will be undefined for non-authenticated requests
    const comments = await Comment.find({ post: postId })
      .populate('user', 'username')
      .sort({ createdAt: -1 });

    // Fetch avatars for all users who commented
    const userIds = comments.map(comment => comment.user._id);
    const accounts = await Account.find({ userId: { $in: userIds } }, 'userId avatar');

    // Create a map of user IDs to avatars
    const avatarMap = new Map(accounts.map(account => [account.userId.toString(), account.avatar]));

    // Add avatar and vote status to each comment
    const commentsWithAvatars = comments.map(comment => {
      const commentObj = comment.toObject();
      commentObj.user.avatar = avatarMap.get(comment.user._id.toString()) || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';
      if (userId) {
        commentObj.userVoteStatus = {
          upvoted: comment.upvotes.includes(userId),
          downvoted: comment.downvotes.includes(userId)
        };
      }
      commentObj.upvotesCount = comment.upvotes.length;
      commentObj.downvotesCount = comment.downvotes.length;
      return commentObj;
    });

    res.status(200).json(commentsWithAvatars);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

exports.getPublicComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ post: postId })
      .populate('user', 'username')
      .sort({ createdAt: -1 });

    // Fetch avatars for all users who commented
    const userIds = comments.map(comment => comment.user._id);
    const accounts = await Account.find({ userId: { $in: userIds } }, 'userId avatar');

    // Create a map of user IDs to avatars
    const avatarMap = new Map(accounts.map(account => [account.userId.toString(), account.avatar]));

    // Add avatar and vote counts to each comment
    const commentsWithAvatars = comments.map(comment => {
      const commentObj = comment.toObject();
      commentObj.user.avatar = avatarMap.get(comment.user._id.toString()) || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';
      // Include vote counts for public users
      commentObj.upvotesCount = comment.upvotes.length;
      commentObj.downvotesCount = comment.downvotes.length;
      // Remove sensitive information
      delete commentObj.upvotes;
      delete commentObj.downvotes;
      return commentObj;
    });

    res.status(200).json(commentsWithAvatars);
  } catch (error) {
    console.error("Error fetching public comments:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
