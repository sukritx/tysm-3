import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../config/api';

const CommunityListPage = () => {
  const navigate = useNavigate();
  const [communities, setCommunities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      const response = await apiClient.get('/fakbok/communities');
      setCommunities(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinLeave = async (communityId, isJoined) => {
    try {
      const endpoint = isJoined ? 'leave' : 'join';
      await apiClient.post(`/fakbok/communities/${communityId}/${endpoint}`);
      fetchCommunities(); // Refresh the list
    } catch (error) {
      console.error(`Error ${isJoined ? 'leaving' : 'joining'} community:`, error);
    }
  };

  const filteredCommunities = communities.filter(community =>
    community.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Communities</h1>
        <button
          onClick={() => navigate('/create-community')}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
        >
          Create Community
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search communities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder-gray-500"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCommunities.map((community) => (
          <div
            key={community.id}
            className="border rounded-lg shadow-md bg-white overflow-hidden"
          >
            {community.banner && (
              <img
                src={community.banner}
                alt={community.name}
                className="w-full h-32 object-cover"
              />
            )}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h2
                  className="text-xl font-semibold text-gray-800 cursor-pointer hover:text-blue-500"
                  onClick={() => navigate(`/community/${community.id}`)}
                >
                  {community.name}
                </h2>
                <button
                  onClick={() => handleJoinLeave(community.id, community.isJoined)}
                  className={`px-4 py-1 rounded ${
                    community.isJoined
                      ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  } transition`}
                >
                  {community.isJoined ? 'Leave' : 'Join'}
                </button>
              </div>
              <p className="text-gray-600 text-sm mb-2">{community.description}</p>
              <div className="flex items-center text-gray-500 text-sm">
                <span>{community.memberCount} members</span>
                <span className="mx-2">•</span>
                <span>{community.postCount} posts</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommunityListPage;
