import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../config/api';

const CommunityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [sortOption, setSortOption] = useState('new');
  const [loading, setLoading] = useState(true);

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
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await apiClient.get(`/fakbok/posts/community/${id}?sort=${sortOption}`);
      setPosts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinLeave = async () => {
    try {
      const endpoint = community.isJoined ? 'leave' : 'join';
      await apiClient.post(`/fakbok/communities/${id}/${endpoint}`);
      fetchCommunityDetails();
    } catch (error) {
      console.error(`Error ${community.isJoined ? 'leaving' : 'joining'} community:`, error);
    }
  };

  if (loading || !community) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Community Banner */}
      <div className="relative h-48 bg-gray-300">
        {community.banner && (
          <img
            src={community.banner}
            alt={community.name}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Community Info */}
      <div className="container mx-auto px-4 -mt-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{community.name}</h1>
              <p className="text-gray-600 mt-2">{community.description}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleJoinLeave}
                className={`px-6 py-2 rounded-full ${
                  community.isJoined
                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                } transition`}
              >
                {community.isJoined ? 'Leave' : 'Join'}
              </button>
              <button
                onClick={() => navigate('/create-post')}
                className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition"
              >
                Create Post
              </button>
            </div>
          </div>

          <div className="flex items-center mt-4 text-gray-500">
            <span>{community.memberCount} members</span>
            <span className="mx-2">•</span>
            <span>{posts.length} posts</span>
          </div>
        </div>

        {/* Rules and Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            {/* Sort Options */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <div className="flex space-x-4">
                <button
                  onClick={() => setSortOption('new')}
                  className={`px-4 py-2 rounded ${
                    sortOption === 'new'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  New
                </button>
                <button
                  onClick={() => setSortOption('hot')}
                  className={`px-4 py-2 rounded ${
                    sortOption === 'hot'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Hot
                </button>
                <button
                  onClick={() => setSortOption('top')}
                  className={`px-4 py-2 rounded ${
                    sortOption === 'top'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Top
                </button>
              </div>
            </div>

            {/* Posts */}
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition"
                  onClick={() => navigate(`/post/${post.id}`)}
                >
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">{post.title}</h2>
                  <p className="text-gray-600 mb-4">{post.body}</p>
                  <div className="flex items-center text-gray-500 text-sm">
                    <span>{post.upvotes} upvotes</span>
                    <span className="mx-2">•</span>
                    <span>{post.commentCount} comments</span>
                    <span className="mx-2">•</span>
                    <span>Posted by {post.author}</span>
                  </div>
                </div>
              ))}
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
