// Home.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { FaArrowUp, FaArrowDown, FaComment } from 'react-icons/fa';
import { toast } from 'react-toastify';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCommunities, setFilteredCommunities] = useState([]);
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

  useEffect(() => {
    const filterCommunities = () => {
      const filtered = communities.filter(community => 
        community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (community.description && community.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredCommunities(filtered);
    };

    filterCommunities();
  }, [searchQuery, communities]);

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

  const handlePostClick = (postId) => {
    navigate(`/post/${postId}`);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSortChange = (option) => {
    setSortOption(option); // Update the sort option when a button is clicked
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-white">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-800">Global Feed</h1>

      {/* Top Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <button
          onClick={() => navigate('/create-post')}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors order-2 sm:order-1"
        >
          Create Post
        </button>
        
        {/* Search Bar */}
        <div className="flex flex-1 gap-2 order-1 sm:order-2">
          <input
            type="text"
            placeholder="Search for communities..."
            className="flex-grow p-2 sm:p-3 border rounded-lg border-gray-300 text-base sm:text-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <button className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white text-base sm:text-lg font-medium rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap">
            Search
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-800">Latest Posts</h2>
            
            {/* Sort Options */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button 
                onClick={() => handleSortChange('new')} 
                className={`px-4 py-2 text-sm sm:text-base rounded-lg transition-colors ${
                  sortOption === 'new' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                New
              </button>
              <button 
                onClick={() => handleSortChange('hot')} 
                className={`px-4 py-2 text-sm sm:text-base rounded-lg transition-colors ${
                  sortOption === 'hot' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                Hot
              </button>
              <button 
                onClick={() => handleSortChange('top')} 
                className={`px-4 py-2 text-sm sm:text-base rounded-lg transition-colors ${
                  sortOption === 'top' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                Top
              </button>
            </div>

            {/* Posts Grid */}
            <div className="grid grid-cols-1 gap-4">
              {posts.map((post) => {
                const voteStatus = getVoteStatus(post);
                return (
                  <div 
                    key={post._id} 
                    className="p-3 sm:p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-white"
                    onClick={() => handlePostClick(post._id)}
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="flex flex-col items-center gap-1">
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
                          <FaArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <span className={`text-sm sm:text-base font-semibold ${
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
                          <FaArrowDown className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="font-medium text-blue-600">{post.community_id?.name}</span>
                            <span>•</span>
                            <span>Posted by {post.author_id?.username}</span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">{post.title}</h3>
                          <p className="text-gray-700">{post.body}</p>
                          {post.media_url && (
                            <div className="mb-3">
                              <img
                                src={post.media_url}
                                alt="Post content"
                                className="w-full h-auto rounded-lg"
                                style={{ maxHeight: '300px', objectFit: 'contain' }}
                              />
                            </div>
                          )}
                          <div className="flex items-center gap-3 text-gray-500 text-sm">
                            <div className="flex items-center gap-1">
                              <FaComment className="w-4 h-4" />
                              <span>{post.commentsCount || 0} comments</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 order-1 lg:order-2">
          <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 sticky top-4">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-800">Communities</h2>
            {filteredCommunities.length === 0 ? (
              <p className="text-base sm:text-lg text-gray-600">No communities found</p>
            ) : (
              <div className="space-y-3">
                {filteredCommunities.map((community) => (
                  <div
                    key={community._id}
                    onClick={() => navigate(`/communities/${community._id}`)}
                    className="p-3 sm:p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {community.banner && (
                        <img
                          src={community.banner}
                          alt={community.name}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-800 truncate">{community.name}</h3>
                        <p className="text-sm sm:text-base text-gray-600">{community.memberCount || 0} members</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;