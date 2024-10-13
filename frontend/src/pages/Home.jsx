import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from '../context/AuthContext'; // Import useAuth
import SecondaryNavbar from '../components/SecondaryNavBar';
import { User, MessageSquare, Send, ArrowUp, ArrowDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";

  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";

  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";

  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";

  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";

  return Math.floor(seconds) + " seconds ago";
};

const PostCard = ({ post, onVote }) => {
  const { getToken } = useAuth();
  const [voteStatus, setVoteStatus] = useState(post.userVoteStatus || { upvoted: false, downvoted: false });
  const [voteCount, setVoteCount] = useState((post.upvotes?.length || 0) - (post.downvotes?.length || 0));

  const handleVote = async (voteType) => {
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
      
      // Update local vote status
      if (response.data.userVoteStatus) {
        setVoteStatus(response.data.userVoteStatus);
      } else {
        console.error('Server response missing userVoteStatus:', response.data);
        // Fallback: toggle the vote status based on the action
        setVoteStatus(prevStatus => ({
          upvoted: voteType === 'upvote' ? !prevStatus.upvoted : false,
          downvoted: voteType === 'downvote' ? !prevStatus.downvoted : false
        }));
      }
      
      // Calculate vote count from upvotes and downvotes arrays
      const newVoteCount = (response.data.upvotes?.length || 0) - (response.data.downvotes?.length || 0);
      setVoteCount(newVoteCount);
      
      // Call the parent's onVote function
      onVote(post._id, response.data);
    } catch (error) {
      console.error(`Error ${voteType}ing post:`, error);
    }
  };

  const username = post.user?.username || 'Anonymous';
  const avatarUrl = post.user?.avatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';

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

  return (
    <div className="p-4 bg-background !bg-background text-foreground shadow-md rounded-lg mt-4 border border-border">
      {/* Post Header */}
      <div className="flex items-center space-x-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatarUrl} alt={username} />
          <AvatarFallback>{username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm text-muted-foreground">
            <strong>{post.examSession?.exam?.name || 'Unknown Exam'}</strong> • {timeAgo(post.createdAt)}
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
          {post.examSession?.exam?.name} {post.examSession?.subject?.name} {post.examSession?.name}
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
            <span>{post.comments?.length || 0}</span>
          </button>
          <button className="flex items-center space-x-2 text-muted-foreground text-base hover:text-foreground transition-colors">
            <Send className="w-6 h-6" />
          </button>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => handleVote('upvote')}
            className={`flex items-center space-x-1 text-base transition-colors rounded-full p-1 ${getUpvoteButtonClass()}`}
          >
            <ArrowUp className="w-7 h-7" />
          </button>
          <span className="text-base font-medium text-muted-foreground">
            {voteCount}
          </span>
          <button 
            onClick={() => handleVote('downvote')}
            className={`flex items-center space-x-1 text-base transition-colors rounded-full p-1 ${getDownvoteButtonClass()}`}
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
  const { getToken, isAuthenticated } = useAuth(); // Add isAuthenticated

  useEffect(() => {
    fetchPosts();
  }, [isAuthenticated]); // Re-fetch when authentication status changes

  const fetchPosts = async () => {
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
  };

  const handleVote = (postId, updatedPost) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post._id === postId ? { ...post, ...updatedPost } : post
      )
    );
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  // Check if posts is an array
  const postsArray = Array.isArray(posts) ? posts : [];

  return (
    <div className="max-w-lg mx-auto">
      <SecondaryNavbar />
      {isAuthenticated ? (
        // Render authenticated content
        postsArray.map(post => (
          <PostCard key={post._id} post={post} onVote={handleVote} />
        ))
      ) : (
        // Render public content
        postsArray.map(post => (
          <PostCard key={post._id} post={post} onVote={() => {}} /> // Disable voting for public posts
        ))
      )}
    </div>
  );
};

export default Home;
