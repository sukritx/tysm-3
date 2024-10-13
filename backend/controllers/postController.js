const mongoose = require('mongoose');
const Post = require('../models/post.model');
const User = require('../models/user.model');
const ExamSession = require('../models/session.model');
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

exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', 'username')
      .populate('examSession')
      .sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

exports.createPost = async (req, res) => {
  const upload = fileUpload({ destination: 'posts' }).single('image');

  upload(req, res, async function(err) {
    if (err) {
      console.error("Error uploading file:", err);
      return res.status(500).json({ error: "Error uploading file", details: err.message });
    }

    try {
      const { heading, examSessionId } = req.body;
      const userId = req.user._id;

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      let imageUrl = null;
      if (req.file) {
        imageUrl = `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_REGION}.cdn.digitaloceanspaces.com/${req.file.key}`;
      }

      const newPost = new Post({
        user: userId,
        heading,
        image: imageUrl,
        examSession: examSessionId
      });

      const savedPost = await newPost.save();
      res.status(201).json(savedPost);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  });
};

exports.getPost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id)
      .populate('user', 'username')
      .populate('examSession');

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json(post);
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { heading, image } = req.body;
    const userId = req.userId;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.user.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to update this post" });
    }

    post.heading = heading || post.heading;
    post.image = image || post.image;

    const updatedPost = await post.save();
    res.status(200).json(updatedPost);
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.user.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to delete this post" });
    }

    await post.remove();
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

exports.upvotePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.upvotes.includes(userId)) {
      post.upvotes = post.upvotes.filter(id => id.toString() !== userId);
    } else {
      post.upvotes.push(userId);
      post.downvotes = post.downvotes.filter(id => id.toString() !== userId);
    }

    const updatedPost = await post.save();
    res.status(200).json(updatedPost);
  } catch (error) {
    console.error("Error upvoting post:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

exports.downvotePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.downvotes.includes(userId)) {
      post.downvotes = post.downvotes.filter(id => id.toString() !== userId);
    } else {
      post.downvotes.push(userId);
      post.upvotes = post.upvotes.filter(id => id.toString() !== userId);
    }

    const updatedPost = await post.save();
    res.status(200).json(updatedPost);
  } catch (error) {
    console.error("Error downvoting post:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

exports.getVotingHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id)
      .populate('upvotes', 'username')
      .populate('downvotes', 'username');

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const votingHistory = {
      upvotes: post.upvotes.map(user => ({ id: user._id, username: user.username })),
      downvotes: post.downvotes.map(user => ({ id: user._id, username: user.username }))
    };

    res.status(200).json(votingHistory);
  } catch (error) {
    console.error("Error fetching voting history:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

exports.filterPosts = async (req, res) => {
  try {
    const { examId, subjectId, sessionId, page = 1, limit = 10 } = req.query;

    let query = {};

    // Input validation
    if (sessionId && !mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: "Invalid sessionId" });
    }
    if (subjectId && !mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({ message: "Invalid subjectId" });
    }
    if (examId && !mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(400).json({ message: "Invalid examId" });
    }

    if (sessionId) {
      query.examSession = sessionId;
    } else if (subjectId) {
      const sessions = await ExamSession.find({ subject: subjectId }).select('_id');
      query.examSession = { $in: sessions.map(session => session._id) };
    } else if (examId) {
      const sessions = await ExamSession.find({ exam: examId }).select('_id');
      query.examSession = { $in: sessions.map(session => session._id) };
    }

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 },
      populate: [
        { path: 'user', select: 'username' },
        { path: 'examSession', select: 'name date' }
      ]
    };

    const posts = await Post.paginate(query, options);

    res.status(200).json({
      posts: posts.docs,
      totalPages: posts.totalPages,
      currentPage: posts.page,
      totalPosts: posts.totalDocs
    });
  } catch (error) {
    console.error("Error filtering posts:", error);
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
