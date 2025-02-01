import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const CommunityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [sortOption, setSortOption] = useState('new');
  const [loading, setLoading] = useState(true);
  const [joinLoading, setJoinLoading] = useState(false);
  const [votingInProgress, setVotingInProgress] = useState({});

  useEffect(() => {
    fetchCommunityDetails();
    fetchPosts();
  }, [id, sortOption]);

  const fetchCommunityDetails = async () => {
    try {
      const response = await apiClient.get(`/fakbok/communities/${id}`);
      setCommunity(response.data);
    } catch (error) {
      console.error('Error fetching community details:', error);
      toast.error('Failed to load community details');
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await apiClient.get(`/fakbok/posts/community/${id}?sortBy=${sortOption}`);
      console.log('Posts response:', response.data); // Add logging
      setPosts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinLeave = async () => {
    if (!user) {
      toast.error('Please log in to join communities');
      navigate('/login');
      return;
    }

    setJoinLoading(true);
    try {
      const endpoint = community.isJoined ? 'leave' : 'join';
      const response = await apiClient.post(`/fakbok/communities/${id}/${endpoint}`);
      
      // Update community state with the response data
      setCommunity(response.data);
      
      // Show success message after state is updated
      toast.success(community.isJoined ? 'Successfully left community' : 'Successfully joined community');
    } catch (error) {
      console.error(`Error ${community.isJoined ? 'leaving' : 'joining'} community:`, error);
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        if (community.isJoined) {
          toast.error('You are not a member of this community');
        } else {
          toast.error('You are already a member of this community');
        }
      } else {
        toast.error(`Failed to ${community.isJoined ? 'leave' : 'join'} community. Please try again.`);
      }
    } finally {
      setJoinLoading(false);
    }
  };

  const handleVote = async (e, postId, voteType) => {
    e.stopPropagation(); // Prevent post click when voting
    if (!user) {
      toast.error('Please log in to vote');
      return;
    }

    // Prevent multiple votes while processing
    if (votingInProgress[postId]) {
      return;
    }

    setVotingInProgress(prev => ({ ...prev, [postId]: true }));

    try {
      const response = await apiClient.post(`/fakbok/posts/${postId}/${voteType}`, {
        userId: user.id
      });
      
      // Update the posts list with the updated post
      setPosts(posts.map(post => 
        post._id === postId ? response.data : post
      ));
    } catch (error) {
      console.error(`Error ${voteType}ing post:`, error);
      toast.error(error.response?.data?.error || `Failed to ${voteType} post`);
    } finally {
      setVotingInProgress(prev => ({ ...prev, [postId]: false }));
    }
  };

  const getVoteStatus = (post) => {
    if (!user) return 'none';
    if (post.upvotes?.includes(user.id)) return 'upvoted';
    if (post.downvotes?.includes(user.id)) return 'downvoted';
    return 'none';
  };

  if (loading || !community) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Community Banner */}
      <div className="relative h-64 bg-gray-300">
        {community.banner && (
          <img
            src={community.banner}
            alt={community.name}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
      </div>

      {/* Community Info */}
      <div className="container mx-auto px-4 relative">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 -mt-16 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800">{community.name}</h1>
              <p className="text-gray-600 mt-2">{community.description}</p>
              <div className="flex items-center mt-4 text-gray-500">
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path>
                  </svg>
                  {community.memberCount || 0} members
                </span>
                <span className="mx-2">•</span>
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                  </svg>
                  {posts.length} posts
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleJoinLeave}
                  disabled={joinLoading}
                  className={`px-6 py-2 rounded-full flex items-center justify-center ${
                    joinLoading ? 'opacity-50 cursor-not-allowed' : ''
                  } ${
                    community.isJoined
                      ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  } transition`}
                >
                  {joinLoading ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                  ) : null}
                  {community.isJoined ? 'Leave Community' : 'Join Community'}
                </button>
                {community.isJoined && (
                  <button
                    onClick={() => navigate('/create-post')}
                    className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition"
                  >
                    Create Post
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rules and Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            {/* Sort Options */}
            <div className="mb-4 flex gap-2">
              {['new', 'hot', 'top'].map((option) => (
                <button
                  key={option}
                  onClick={() => setSortOption(option)}
                  className={`px-4 py-2 rounded-full capitalize ${
                    sortOption === option
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } transition-colors`}
                >
                  {option}
                </button>
              ))}
            </div>

            {/* Posts */}
            <div className="space-y-4">
              {posts.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-lg shadow">
                  <p className="text-gray-500">No posts in this community yet.</p>
                  {community.isJoined && (
                    <button
                      onClick={() => navigate('/create-post')}
                      className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                    >
                      Create the first post
                    </button>
                  )}
                </div>
              ) : (
                posts.map((post) => (
                  <div
                    key={post._id}
                    onClick={() => navigate(`/post/${post._id}`)}
                    className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-semibold text-gray-700">
                          {post.score || 0}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>{post.author_id?.username || 'Unknown'}</span>
                          <span>•</span>
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mt-1">
                          {post.title}
                        </h3>
                        {post.media_url && (
                          <img
                            src={post.media_url}
                            alt={post.title}
                            className="mt-2 max-h-48 rounded object-cover"
                          />
                        )}
                        <div className="mt-2 text-sm text-gray-500">
                          {post.commentsCount || 0} comments
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Community Rules */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Community Rules</h2>
              {community.rules && community.rules.map((rule, index) => (
                <div key={index} className="mb-3 pb-3 border-b border-gray-200 last:border-0">
                  <h3 className="font-medium text-gray-800">{index + 1}. {rule.title}</h3>
                  <p className="text-gray-600 text-sm">{rule.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityDetail;
