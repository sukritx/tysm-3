import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from '../context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Share2, ArrowUp, ArrowDown, Image, Send } from "lucide-react";
import { timeAgo } from '../utils/timeAgo';
import toast from 'react-hot-toast';

const PostPage = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getToken, isAuthenticated, user } = useAuth();
  const [voteStatus, setVoteStatus] = useState({ upvoted: false, downvoted: false });
  const [voteCount, setVoteCount] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [commentImage, setCommentImage] = useState(null);
  const [commentFilter, setCommentFilter] = useState('recent'); // 'recent' or 'upvoted'

  const fetchPost = useCallback(async () => {
    try {
      let response;
      if (isAuthenticated) {
        const token = getToken();
        response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v2/posts/${id}`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
      } else {
        response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v2/posts/${id}/public`);
      }
      setPost(response.data);
      setVoteStatus(response.data.userVoteStatus || { upvoted: false, downvoted: false });
      setVoteCount(response.data.upvotesCount - response.data.downvotesCount);
    } catch (err) {
      console.error("Error fetching post:", err);
      setError("Failed to fetch post. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [id, isAuthenticated, getToken]);

  const fetchComments = useCallback(async () => {
    try {
      let response;
      if (isAuthenticated) {
        const token = getToken();
        response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v2/comments/post/${id}`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
      } else {
        response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v2/comments/post/${id}/public`);
      }
      setComments(response.data);
    } catch (err) {
      console.error("Error fetching comments:", err);
      setError("Failed to fetch comments. Please try again later.");
    }
  }, [id, isAuthenticated, getToken]);

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [fetchPost, fetchComments]);

  const handleVote = async (voteType) => {
    if (!isAuthenticated) {
      toast.error("Please log in to vote.");
      return;
    }

    try {
      const token = getToken();
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v2/posts/${id}/${voteType}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );
      
      setVoteStatus(response.data.userVoteStatus);
      setVoteCount(response.data.upvotesCount - response.data.downvotesCount);
      setPost(prevPost => ({
        ...prevPost,
        ...response.data,
        user: prevPost.user,
        examSession: prevPost.examSession
      }));
    } catch (error) {
      console.error(`Error ${voteType}ing post:`, error);
      toast.error(`Failed to ${voteType} the post. Please try again.`);
    }
  };

  const handleShareClick = () => {
    const postUrl = `${window.location.origin}/post/${id}`;
    navigator.clipboard.writeText(postUrl).then(() => {
      toast.success('Link copied to clipboard!');
    }, (err) => {
      console.error('Could not copy text: ', err);
      toast.error('Failed to copy link');
    });
  };

  const getUpvoteButtonClass = () => {
    if (voteStatus?.upvoted) {
      return 'text-green-500 bg-green-100';
    } else if (voteStatus?.downvoted) {
      return 'text-muted-foreground';
    } else {
      return 'text-muted-foreground hover:text-green-500 hover:bg-green-100';
    }
  };

  const getDownvoteButtonClass = () => {
    if (voteStatus?.downvoted) {
      return 'text-red-500 bg-red-100';
    } else if (voteStatus?.upvoted) {
      return 'text-muted-foreground';
    } else {
      return 'text-muted-foreground hover:text-red-500 hover:bg-red-100';
    }
  };

  const handleCommentVote = async (commentId, voteType) => {
    if (!isAuthenticated) {
      toast.error("Please log in to vote.");
      return;
    }

    try {
      const token = getToken();
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v2/comments/${commentId}/${voteType}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );
      
      setComments(prevComments => 
        prevComments.map(comment => 
          comment._id === commentId 
            ? { 
                ...comment, 
                ...response.data, 
                user: comment.user // Keep the original user data
              } 
            : comment
        )
      );
    } catch (error) {
      console.error(`Error ${voteType}ing comment:`, error);
      toast.error(`Failed to ${voteType} the comment. Please try again.`);
    }
  };

  const getCommentVoteCount = (comment) => {
    return (comment.upvotesCount || 0) - (comment.downvotesCount || 0);
  };

  const getCommentUpvoteButtonClass = (comment) => {
    if (comment.userVoteStatus?.upvoted) {
      return 'text-green-500 bg-green-100';
    } else {
      return 'text-muted-foreground hover:text-green-500 hover:bg-green-100';
    }
  };

  const getCommentDownvoteButtonClass = (comment) => {
    if (comment.userVoteStatus?.downvoted) {
      return 'text-red-500 bg-red-100';
    } else {
      return 'text-muted-foreground hover:text-red-500 hover:bg-red-100';
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Please log in to comment.");
      return;
    }

    if (!newComment.trim() && !commentImage) {
      toast.error("Please enter a comment or upload an image.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('text', newComment);
      formData.append('postId', id);
      if (commentImage) {
        formData.append('image', commentImage);
      }

      const token = getToken();
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v2/comments`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Add the current user's information to the new comment
      const newCommentWithUser = {
        ...response.data,
        user: {
          _id: user._id,
          username: user.username,
          avatar: user.avatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png'
        },
        upvotesCount: 0,
        downvotesCount: 0,
        userVoteStatus: { upvoted: false, downvoted: false }
      };

      setComments(prevComments => [newCommentWithUser, ...prevComments]);
      setNewComment("");
      setCommentImage(null);
      toast.success("Comment posted successfully!");
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Failed to post comment. Please try again.");
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCommentImage(file);
    }
  };

  const sortComments = useCallback((commentsToSort) => {
    if (commentFilter === 'recent') {
      return [...commentsToSort].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (commentFilter === 'upvoted') {
      return [...commentsToSort].sort((a, b) => (b.upvotesCount - b.downvotesCount) - (a.upvotesCount - a.downvotesCount));
    }
    return commentsToSort;
  }, [commentFilter]);

  const handleFilterChange = (filter) => {
    setCommentFilter(filter);
  };

  const getExamName = () => {
    if (post.examName) {
      return post.examName;
    } else if (post.exam && typeof post.exam === 'object' && post.exam.name) {
      return post.exam.name;
    }
    return "Unknown Exam";
  };

  const getSubjectName = () => {
    if (post.subjectName) {
      return post.subjectName;
    } else if (post.subject && typeof post.subject === 'object' && post.subject.name) {
      return post.subject.name;
    }
    return "";
  };

  const getSessionName = () => {
    if (post.sessionName) {
      return post.sessionName;
    } else if (post.examSession && typeof post.examSession === 'object' && post.examSession.name) {
      return post.examSession.name;
    }
    return "";
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!post) return <div>Post not found</div>;

  const username = post.user?.username || 'Anonymous';
  const avatarUrl = post.user?.avatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';

  return (
    <div className="max-w-2xl mx-auto mt-8 p-4">
      <div className="bg-background text-foreground shadow-md rounded-lg p-6">
        {/* Post Header */}
        <div className="flex items-center space-x-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatarUrl} alt={username} />
            <AvatarFallback>{username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">
              <strong>{getExamName()}</strong> • {timeAgo(post.createdAt)}
            </span>
            <Link 
              to={`/${username}`} 
              className="text-xs text-primary hover:text-primary/80 transition-colors mt-1"
            >
              @{username}
            </Link>
          </div>
        </div>

        {/* Post Content */}
        <div className="mt-3">
          <h2 className="text-lg font-semibold">{post.heading}</h2>
          <p className="text-sm text-muted-foreground">
            {getExamName()} {getSubjectName()} {getSessionName()}
          </p>
          {post.image && (
            <img
              src={post.image}
              alt="Post Content"
              className="rounded-lg mt-3 w-full"
            />
          )}
        </div>

        {/* Post Actions */}
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 text-muted-foreground text-base hover:text-foreground transition-colors">
              <MessageSquare className="w-6 h-6" />
              <span>{comments.length}</span>
            </button>
            <button 
              className="flex items-center space-x-2 text-muted-foreground text-base hover:text-foreground transition-colors"
              onClick={handleShareClick}
            >
              <Share2 className="w-6 h-6" />
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => handleVote('upvote')}
              className={`flex items-center space-x-1 text-base transition-colors rounded-full p-1 ${getUpvoteButtonClass()} ${!isAuthenticated && 'opacity-50 cursor-not-allowed'}`}
              disabled={!isAuthenticated}
            >
              <ArrowUp className="w-7 h-7" />
            </button>
            <span className="text-base font-medium text-muted-foreground">
              {voteCount}
            </span>
            <button 
              onClick={() => handleVote('downvote')}
              className={`flex items-center space-x-1 text-base transition-colors rounded-full p-1 ${getDownvoteButtonClass()} ${!isAuthenticated && 'opacity-50 cursor-not-allowed'}`}
              disabled={!isAuthenticated}
            >
              <ArrowDown className="w-7 h-7" />
            </button>
          </div>
        </div>

        {/* New Comment Box */}
        {isAuthenticated && (
          <div className="mt-6 mb-8">
            <h3 className="text-lg font-semibold mb-2">Add a Comment</h3>
            <form onSubmit={handleCommentSubmit} className="space-y-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write your comment here..."
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Image className="w-6 h-6 text-gray-500 hover:text-blue-500" />
                  </label>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  {commentImage && <span className="text-sm text-gray-500">Image selected</span>}
                </div>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Comments Section */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Comments</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => handleFilterChange('recent')}
                className={`px-3 py-1 rounded ${commentFilter === 'recent' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                Most Recent
              </button>
              <button
                onClick={() => handleFilterChange('upvoted')}
                className={`px-3 py-1 rounded ${commentFilter === 'upvoted' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                Most Upvoted
              </button>
            </div>
          </div>
          {sortComments(comments).map((comment) => (
            <div key={comment._id} className="bg-secondary p-4 rounded-lg mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.user?.avatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png'} alt={comment.user?.username} />
                  <AvatarFallback>{comment.user?.username?.charAt(0).toUpperCase() || 'A'}</AvatarFallback>
                </Avatar>
                <span className="font-semibold">{comment.user?.username || 'Anonymous'}</span>
                <span className="text-sm text-muted-foreground">{timeAgo(comment.createdAt)}</span>
              </div>
              <p>{comment.text}</p>
              {comment.image && (
                <img src={comment.image} alt="Comment Image" className="mt-2 max-w-full h-auto rounded-lg" />
              )}
              <div className="flex items-center space-x-4 mt-2">
                <button 
                  onClick={() => handleCommentVote(comment._id, 'upvote')}
                  className={`flex items-center justify-center w-8 h-8 text-sm transition-colors rounded-full ${getCommentUpvoteButtonClass(comment)} ${!isAuthenticated && 'opacity-50 cursor-not-allowed'}`}
                  disabled={!isAuthenticated}
                >
                  <ArrowUp className="w-5 h-5" />
                </button>
                <span className="text-sm font-medium text-muted-foreground">
                  {getCommentVoteCount(comment)}
                </span>
                <button 
                  onClick={() => handleCommentVote(comment._id, 'downvote')}
                  className={`flex items-center justify-center w-8 h-8 text-sm transition-colors rounded-full ${getCommentDownvoteButtonClass(comment)} ${!isAuthenticated && 'opacity-50 cursor-not-allowed'}`}
                  disabled={!isAuthenticated}
                >
                  <ArrowDown className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PostPage;