const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

exports.getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, profilePicture } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the authenticated user is updating their own profile
    if (req.userId !== id) {
      return res.status(403).json({ message: "Not authorized to update this user" });
    }

    user.username = username || user.username;
    user.email = email || user.email;
    user.profilePicture = profilePicture || user.profilePicture;

    const updatedUser = await user.save();
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

exports.getActivityHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const posts = await Post.find({ user: id }).sort({ createdAt: -1 }).limit(10);
    const comments = await Comment.find({ user: id }).sort({ createdAt: -1 }).limit(10);

    const activity = [
      ...posts.map(post => ({ type: 'post', data: post, createdAt: post.createdAt })),
      ...comments.map(comment => ({ type: 'comment', data: comment, createdAt: comment.createdAt }))
    ].sort((a, b) => b.createdAt - a.createdAt).slice(0, 20);

    res.status(200).json(activity);
  } catch (error) {
    console.error("Error fetching activity history:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

exports.getCommitCalendar = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const posts = await Post.find({ user: id, createdAt: { $gte: oneYearAgo } });
    const comments = await Comment.find({ user: id, createdAt: { $gte: oneYearAgo } });

    const commitCalendar = {};

    const addToCalendar = (date) => {
      const dateString = date.toISOString().split('T')[0];
      commitCalendar[dateString] = (commitCalendar[dateString] || 0) + 1;
    };

    posts.forEach(post => addToCalendar(post.createdAt));
    comments.forEach(comment => addToCalendar(comment.createdAt));

    res.status(200).json(commitCalendar);
  } catch (error) {
    console.error("Error fetching commit calendar:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};