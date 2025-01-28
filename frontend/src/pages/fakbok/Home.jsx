// Home.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { FaArrowUp, FaArrowDown, FaComment } from 'react-icons/fa';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('new');
  const [votingInProgress, setVotingInProgress] = useState({});

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await apiClient.get(`/fakbok/posts?sort=${sortOption}`);
        setPosts(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching posts:', error);
        setPosts([]);
      }
    };

    const fetchCommunities = async () => {
      try {
        const response = await apiClient.get('/fakbok/communities');
        setCommunities(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching communities:', error);
        setCommunities([]);
      }
    };

    fetchPosts();
    fetchCommunities();
  }, [sortOption]);

  const handleVote = async (e, postId, voteType) => {
    e.stopPropagation(); // Prevent post click when voting
    if (!user) {
      alert('Please log in to vote');
      return;
    }

    // Prevent multiple votes while processing
    if (votingInProgress[postId]) {
      return;
    }

    setVotingInProgress(prev => ({ ...prev, [postId]: true }));

    try {
      const response = await apiClient.post(`/fakbok/posts/${postId}/${voteType}`, {
        userId: user._id
      });
      
      // Update the posts list with the updated post
      setPosts(posts.map(post => 
        post._id === postId ? response.data : post
      ));
    } catch (error) {
      console.error(`Error ${voteType}ing post:`, error);
      alert(error.response?.data?.error || `Failed to ${voteType} post`);
    } finally {
      setVotingInProgress(prev => ({ ...prev, [postId]: false }));
    }
  };

  const getVoteStatus = (post) => {
    if (!user) return 'none';
    if (post.upvotes?.includes(user._id)) return 'upvoted';
    if (post.downvotes?.includes(user._id)) return 'downvoted';
    return 'none';
  };

  const handlePostClick = (postId) => {
    navigate(`/post/${postId}`);
  };

  return (
    <div className="container mx-auto p-4 bg-white">
      <h1 className="text-3xl font-bold mb-4 text-gray-800">Global Feed</h1>
      <button
        onClick={() => navigate('/create-post')}
        className="mb-4 p-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
      >
        Create Post
      </button>
      <div className="flex mb-4">
        <input
          type="text"
          placeholder="Search..."
          className="flex-grow p-2 border rounded border-gray-300 text-black placeholder-gray-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button className="ml-2 p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
          Search
        </button>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-700">Trending Communities</h2>
        <div className="flex space-x-2 overflow-x-auto">
          {communities.map((community) => (
            <div key={community._id} className="p-2 border rounded shadow bg-gray-100">
              <h3 className="font-bold text-gray-800">{community.name}</h3>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <button 
          onClick={() => setSortOption('new')} 
          className={`mr-2 p-2 text-white rounded transition-colors ${
            sortOption === 'new' ? 'bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          New
        </button>
        <button 
          onClick={() => setSortOption('hot')} 
          className={`mr-2 p-2 text-white rounded transition-colors ${
            sortOption === 'hot' ? 'bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          Hot
        </button>
        <button 
          onClick={() => setSortOption('top')} 
          className={`p-2 text-white rounded transition-colors ${
            sortOption === 'top' ? 'bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          Top
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {posts.map((post) => {
          const voteStatus = getVoteStatus(post);
          return (
            <div 
              key={post._id} 
              className="p-4 border rounded-lg shadow-md bg-gray-100 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handlePostClick(post._id)}
            >
              <div className="flex items-start space-x-4">
                <div className="flex flex-col items-center">
                  <button
                    onClick={(e) => handleVote(e, post._id, 'upvote')}
                    disabled={votingInProgress[post._id]}
                    className={`p-1 rounded transition-colors ${
                      voteStatus === 'upvoted'
                        ? 'text-orange-500 bg-orange-100'
                        : 'text-gray-500 hover:text-orange-500 hover:bg-orange-50'
                    } disabled:opacity-50`}
                    title={voteStatus === 'upvoted' ? 'Remove upvote' : 'Upvote'}
                  >
                    <FaArrowUp size={20} />
                  </button>
                  <span className={`text-sm font-semibold ${
                    voteStatus === 'upvoted' ? 'text-orange-500' :
                    voteStatus === 'downvoted' ? 'text-blue-500' :
                    'text-gray-700'
                  }`}>
                    {(post.upvotes?.length || 0) - (post.downvotes?.length || 0)}
                  </span>
                  <button
                    onClick={(e) => handleVote(e, post._id, 'downvote')}
                    disabled={votingInProgress[post._id]}
                    className={`p-1 rounded transition-colors ${
                      voteStatus === 'downvoted'
                        ? 'text-blue-500 bg-blue-100'
                        : 'text-gray-500 hover:text-blue-500 hover:bg-blue-50'
                    } disabled:opacity-50`}
                    title={voteStatus === 'downvoted' ? 'Remove downvote' : 'Downvote'}
                  >
                    <FaArrowDown size={20} />
                  </button>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">{post.title}</h2>
                  <p className="text-gray-700 mb-3">{post.body}</p>
                  {post.media_url && (
                    <div className="mb-3">
                      <img
                        src={post.media_url}
                        alt="Post content"
                        className="max-w-full h-auto rounded-lg"
                        style={{ maxHeight: '400px', objectFit: 'contain' }}
                      />
                    </div>
                  )}
                  <div className="flex items-center text-gray-500">
                    <FaComment className="mr-1" />
                    <span className="text-sm">{post.comments?.length || 0} comments</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HomePage;