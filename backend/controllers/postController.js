const Post = require('../models/Post');
const User = require('../models/User');
const ExamSession = require('../models/session.model');

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
  try {
    const { heading, image, examSessionId } = req.body;
    const userId = req.userId; // Assuming you have middleware that sets userId

    if (!heading || !examSessionId) {
      return res.status(400).json({ message: "Heading and exam session are required" });
    }

    const newPost = new Post({
      user: userId,
      heading,
      image,
      examSession: examSessionId
    });

    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
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
    const { examId, subjectId, sessionId } = req.query;

    let query = {};

    if (sessionId) {
      query.examSession = sessionId;
    } else if (subjectId) {
      const sessions = await ExamSession.find({ subject: subjectId });
      query.examSession = { $in: sessions.map(session => session._id) };
    } else if (examId) {
      const sessions = await ExamSession.find({ exam: examId });
      query.examSession = { $in: sessions.map(session => session._id) };
    }

    const posts = await Post.find(query)
      .populate('user', 'username')
      .populate('examSession')
      .sort({ createdAt: -1 });

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error filtering posts:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};