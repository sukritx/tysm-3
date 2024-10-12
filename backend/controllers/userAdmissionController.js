const { User, Account } = require('../models/user.model');
const Post = require('../models/post.model');
const Comment = require('../models/comment.model');

exports.getActivityHistory = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const posts = await Post.find({ user: user._id }).sort({ createdAt: -1 }).limit(10);
    const comments = await Comment.find({ user: user._id }).sort({ createdAt: -1 }).limit(10);

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
    const { username } = req.params;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const posts = await Post.find({ user: user._id, createdAt: { $gte: oneYearAgo } });
    const comments = await Comment.find({ user: user._id, createdAt: { $gte: oneYearAgo } });

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
