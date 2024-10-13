import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from '../context/AuthContext';
import SecondaryNavbar from '../components/SecondaryNavBar';
import { MessageSquare, Share2, ArrowUp, ArrowDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { timeAgo } from '../utils/timeAgo';
import toast from 'react-hot-toast';

const PostCard = ({ post, onVote }) => {
  const { getToken, isAuthenticated } = useAuth();
  const [voteStatus, setVoteStatus] = useState(post.userVoteStatus || { upvoted: false, downvoted: false });
  const [voteCount, setVoteCount] = useState((post.upvotes?.length || 0) - (post.downvotes?.length || 0));
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);
  const [localPost, setLocalPost] = useState(post);
  const navigate = useNavigate();

  useEffect(() => {
    setVoteStatus(post.userVoteStatus || { upvoted: false, downvoted: false });
    setVoteCount((post.upvotes?.length || 0) - (post.downvotes?.length || 0));
    setCommentCount(post.commentCount || 0);
    setLocalPost(post);
  }, [post]);

  const handleVote = async (e, voteType) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      console.log("User is not authenticated");
      return;
    }

    try {
      const token = getToken();
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v2/posts/${post._id}/${voteType}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.userVoteStatus) {
        setVoteStatus(response.data.userVoteStatus);
      } else {
        setVoteStatus(prevStatus => ({
          upvoted: voteType === 'upvote' ? !prevStatus.upvoted : false,
          downvoted: voteType === 'downvote' ? !prevStatus.downvoted : false
        }));
      }
      
      const newVoteCount = (response.data.upvotes?.length || 0) - (response.data.downvotes?.length || 0);
      setVoteCount(newVoteCount);
      
      setLocalPost(prevPost => ({
        ...prevPost,
        ...response.data,
        user: prevPost.user,
        examSession: prevPost.examSession
      }));
      
      onVote(post._id, {
        ...response.data,
        user: localPost.user,
        examSession: localPost.examSession
      });
    } catch (error) {
      console.error(`Error ${voteType}ing post:`, error);
    }
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

  const handlePostClick = () => {
    navigate(`/post/${post._id}`);
  };

  const handleCommentClick = (e) => {
    e.stopPropagation();
    navigate(`/post/${post._id}`);
  };

  const handleShareClick = (e) => {
    e.stopPropagation();
    const postUrl = `${window.location.origin}/post/${post._id}`;
    navigator.clipboard.writeText(postUrl).then(() => {
      toast.success('Link copied to clipboard!');
    }, (err) => {
      console.error('Could not copy text: ', err);
      toast.error('Failed to copy link');
    });
  };

  return (
    <div 
      className="p-4 bg-background !bg-background text-foreground shadow-md rounded-lg mt-4 border border-border cursor-pointer"
      onClick={handlePostClick}
    >
      {/* Post Header */}
      <div className="flex items-center space-x-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={localPost.user?.avatar} alt={localPost.user?.username} />
          <AvatarFallback>{localPost.user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground">
            <strong>{localPost.examSession?.exam?.name || 'Unknown Exam'}</strong> • {timeAgo(localPost.createdAt)}
          </span>
          <Link 
            to={`/${localPost.user?.username}`} 
            className="text-xs text-primary hover:text-primary/80 transition-colors mt-1"
            onClick={(e) => e.stopPropagation()}
          >
            @{localPost.user?.username || 'Anonymous'}
          </Link>
        </div>
      </div>

      {/* Post Content */}
      <div className="mt-3">
        <h2 className="text-lg font-semibold">{localPost.heading}</h2>
        <p className="text-sm text-muted-foreground">
          {localPost.examSession?.exam?.name} {localPost.examSession?.subject?.name} {localPost.examSession?.name}
        </p>
        {localPost.image && (
          <img
            src={localPost.image}
            alt="Post Content"
            className="rounded-lg mt-3 w-full"
          />
        )}
      </div>

      {/* Post Actions */}
      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center space-x-4">
          <button 
            className="flex items-center space-x-2 text-muted-foreground text-base hover:text-foreground transition-colors"
            onClick={handleCommentClick}
          >
            <MessageSquare className="w-6 h-6" />
            <span>{commentCount}</span>
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
            onClick={(e) => handleVote(e, 'upvote')}
            className={`flex items-center space-x-1 text-base transition-colors rounded-full p-1 ${getUpvoteButtonClass()} ${!isAuthenticated && 'opacity-50 cursor-not-allowed'}`}
            disabled={!isAuthenticated}
          >
            <ArrowUp className="w-7 h-7" />
          </button>
          <span className="text-base font-medium text-muted-foreground">
            {voteCount}
          </span>
          <button 
            onClick={(e) => handleVote(e, 'downvote')}
            className={`flex items-center space-x-1 text-base transition-colors rounded-full p-1 ${getDownvoteButtonClass()} ${!isAuthenticated && 'opacity-50 cursor-not-allowed'}`}
            disabled={!isAuthenticated}
          >
            <ArrowDown className="w-7 h-7" />
          </button>
        </div>
      </div>
    </div>
  );
};

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getToken, isAuthenticated } = useAuth();

  const fetchPosts = useCallback(async () => {
    try {
      let response;
      if (isAuthenticated) {
        const token = getToken();
        response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v2/posts/authenticated`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
      } else {
        response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v2/posts/public`);
      }
      console.log("API response:", response.data);
      setPosts(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError("Failed to fetch posts. Please try again later.");
      setLoading(false);
    }
  }, [isAuthenticated, getToken]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleVote = (postId, updatedPost) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post._id === postId ? { ...post, ...updatedPost } : post
      )
    );
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  const postsArray = Array.isArray(posts) ? posts : [];

  return (
    <div className="max-w-lg mx-auto">
      <SecondaryNavbar />
      {postsArray.map(post => (
        <PostCard key={post._id} post={post} onVote={handleVote} />
      ))}
    </div>
  );
};

export default Home;