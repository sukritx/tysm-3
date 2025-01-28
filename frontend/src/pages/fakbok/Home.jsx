// Home.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../config/api';

const HomePage = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('new');

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

  return (
    <div className="container mx-auto p-4 bg-white">
      <h1 className="text-3xl font-bold mb-4 text-gray-800">Global Feed</h1>
      <button
        onClick={() => navigate('/create-post')}
        className="mb-4 p-2 bg-green-500 text-white rounded"
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
        <button className="ml-2 p-2 bg-blue-600 text-white rounded">Search</button>
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
        <button onClick={() => setSortOption('new')} className="mr-2 p-2 bg-blue-500 text-white rounded">New</button>
        <button onClick={() => setSortOption('hot')} className="mr-2 p-2 bg-blue-500 text-white rounded">Hot</button>
        <button onClick={() => setSortOption('top')} className="p-2 bg-blue-500 text-white rounded">Top</button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {posts.map((post) => (
          <div key={post._id} className="p-4 border rounded-lg shadow-md bg-gray-100">
            <h2 className="text-xl font-semibold text-gray-800">{post.title}</h2>
            <p className="text-gray-700">{post.body}</p>
            <p className="text-sm text-gray-500">Upvotes: {post.upvotes}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;