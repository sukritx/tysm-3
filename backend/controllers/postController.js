const mongoose = require('mongoose');
const Post = require('../models/post.model');
const { User, Account } = require('../models/user.model');
const Comment = require('../models/comment.model');
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

exports.getAuthenticatedPosts = async (req, res) => {
  try {
    const userId = req.userId;
    const { exam, subject, session } = req.query;

    let matchStage = {};

    if (session) {
      matchStage.examSession = new mongoose.Types.ObjectId(session);
    } else if (subject) {
      const sessions = await ExamSession.find({ subject: subject }).select('_id');
      matchStage.examSession = { $in: sessions.map(s => s._id) };
    } else if (exam) {
      const sessions = await ExamSession.find({ exam: exam }).select('_id');
      matchStage.examSession = { $in: sessions.map(s => s._id) };
    }

    const posts = await Post.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'post',
          as: 'comments'
        }
      },
      {
        $addFields: {
          commentCount: { $size: "$comments" }
        }
      },
      {
        $project: {
          comments: 0 // Remove the comments array from the result
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $lookup: {
          from: 'examsessions',
          localField: 'examSession',
          foreignField: '_id',
          as: 'examSession'
        }
      },
      {
        $unwind: {
          path: '$examSession',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'exams',
          localField: 'examSession.exam',
          foreignField: '_id',
          as: 'examSession.exam'
        }
      },
      {
        $unwind: {
          path: '$examSession.exam',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'subjects',
          localField: 'examSession.subject',
          foreignField: '_id',
          as: 'examSession.subject'
        }
      },
      {
        $unwind: {
          path: '$examSession.subject',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
          userVoteStatus: {
            upvoted: { $in: [new mongoose.Types.ObjectId(userId), "$upvotes"] },
            downvoted: { $in: [new mongoose.Types.ObjectId(userId), "$downvotes"] }
          }
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

    // Fetch accounts for all users in the posts
    const userIds = posts.map(post => post.user._id);
    const accounts = await Account.find({ userId: { $in: userIds } }, 'userId avatar');

    // Create a map of user IDs to avatars
    const avatarMap = new Map(accounts.map(account => [account.userId.toString(), account.avatar]));

    const postsWithUserData = posts.map(post => ({
      ...post,
      user: {
        ...post.user,
        avatar: avatarMap.get(post.user._id.toString()) || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png'
      }
    }));

    res.status(200).json(postsWithUserData);
  } catch (error) {
    console.error("Error fetching authenticated posts:", error);
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
    const userId = req.userId;

    const post = await Post.findById(id)
      .populate('user', 'username')
      .populate({
        path: 'examSession',
        populate: [
          { path: 'exam', select: 'name' },
          { path: 'subject', select: 'name' }
        ]
      });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const postObject = post.toObject();
    postObject.userVoteStatus = {
      upvoted: post.upvotes.includes(userId),
      downvoted: post.downvotes.includes(userId)
    };
    postObject.upvotesCount = post.upvotes.length;
    postObject.downvotesCount = post.downvotes.length;

    // Calculate comment count
    const commentCount = await Comment.countDocuments({ post: id });

    // Fetch user's avatar
    const account = await Account.findOne({ userId: post.user._id }, 'avatar');

    postObject.commentCount = commentCount;
    postObject.user = {
      ...postObject.user,
      avatar: account?.avatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png'
    };

    res.status(200).json(postObject);
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
    const userId = req.user._id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const upvoteIndex = post.upvotes.indexOf(userId);
    const downvoteIndex = post.downvotes.indexOf(userId);

    if (upvoteIndex > -1) {
      // User has already upvoted, so remove the upvote
      post.upvotes = post.upvotes.filter(id => id.toString() !== userId.toString());
    } else {
      // Add upvote
      post.upvotes.push(userId);
      // Remove downvote if exists
      if (downvoteIndex > -1) {
        post.downvotes = post.downvotes.filter(id => id.toString() !== userId.toString());
      }
    }

    await post.save();

    res.status(200).json({
      ...post.toObject(),
      userVoteStatus: {
        upvoted: post.upvotes.includes(userId),
        downvoted: post.downvotes.includes(userId)
      },
      upvotesCount: post.upvotes.length,
      downvotesCount: post.downvotes.length
    });
  } catch (error) {
    console.error("Error upvoting post:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

exports.downvotePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const downvoteIndex = post.downvotes.indexOf(userId);
    const upvoteIndex = post.upvotes.indexOf(userId);

    if (downvoteIndex > -1) {
      // User has already downvoted, so remove the downvote
      post.downvotes = post.downvotes.filter(id => id.toString() !== userId.toString());
    } else {
      // Add downvote
      post.downvotes.push(userId);
      // Remove upvote if exists
      if (upvoteIndex > -1) {
        post.upvotes = post.upvotes.filter(id => id.toString() !== userId.toString());
      }
    }

    await post.save();

    res.status(200).json({
      ...post.toObject(),
      userVoteStatus: {
        upvoted: post.upvotes.includes(userId),
        downvoted: post.downvotes.includes(userId)
      },
      upvotesCount: post.upvotes.length,
      downvotesCount: post.downvotes.length
    });
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

exports.getPublicPosts = async (req, res) => {
  try {
    const { exam, subject, session } = req.query;

    let matchStage = {};

    if (session) {
      matchStage.examSession = new mongoose.Types.ObjectId(session);
    } else if (subject) {
      const sessions = await ExamSession.find({ subject: subject }).select('_id');
      matchStage.examSession = { $in: sessions.map(s => s._id) };
    } else if (exam) {
      const sessions = await ExamSession.find({ exam: exam }).select('_id');
      matchStage.examSession = { $in: sessions.map(s => s._id) };
    }

    const posts = await Post.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'post',
          as: 'comments'
        }
      },
      {
        $addFields: {
          commentCount: { $size: "$comments" }
        }
      },
      {
        $project: {
          comments: 0 // Remove the comments array from the result
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $lookup: {
          from: 'examsessions',
          localField: 'examSession',
          foreignField: '_id',
          as: 'examSession'
        }
      },
      {
        $unwind: {
          path: '$examSession',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'exams',
          localField: 'examSession.exam',
          foreignField: '_id',
          as: 'examSession.exam'
        }
      },
      {
        $unwind: {
          path: '$examSession.exam',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'subjects',
          localField: 'examSession.subject',
          foreignField: '_id',
          as: 'examSession.subject'
        }
      },
      {
        $unwind: {
          path: '$examSession.subject',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

    // Fetch accounts for all users in the posts
    const userIds = posts.map(post => post.user._id);
    const accounts = await Account.find({ userId: { $in: userIds } }, 'userId avatar');

    // Create a map of user IDs to avatars
    const avatarMap = new Map(accounts.map(account => [account.userId.toString(), account.avatar]));

    const publicPosts = posts.map(post => {
      // Remove the toObject() call
      return {
        ...post,
        user: {
          ...post.user,
          avatar: avatarMap.get(post.user._id.toString()) || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png'
        },
        // Don't include userVoteStatus for public posts
      };
    });

    res.status(200).json(publicPosts);
  } catch (error) {
    console.error("Error fetching public posts:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

exports.getPublicPost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id)
      .populate('user', 'username')
      .populate({
        path: 'examSession',
        populate: [
          { path: 'exam', select: 'name' },
          { path: 'subject', select: 'name' }
        ]
      });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Calculate comment count
    const commentCount = await Comment.countDocuments({ post: id });

    // Fetch user's avatar
    const account = await Account.findOne({ userId: post.user._id }, 'avatar');

    const postObject = post.toObject();
    postObject.commentCount = commentCount;
    postObject.user = {
      ...postObject.user,
      avatar: account?.avatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png'
    };

    // Include vote counts for public posts
    postObject.upvotesCount = post.upvotes.length;
    postObject.downvotesCount = post.downvotes.length;

    // Remove the actual arrays of user IDs for privacy
    delete postObject.upvotes;
    delete postObject.downvotes;

    res.status(200).json(postObject);
  } catch (error) {
    console.error("Error fetching public post:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

module.exports = exports;