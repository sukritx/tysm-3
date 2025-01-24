import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../config/api';

const CreateEditPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [communityName, setCommunityName] = useState('');
  const [communities, setCommunities] = useState([]);
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [newCommunityData, setNewCommunityData] = useState({
    name: '',
    description: '',
    rules: []
  });

  useEffect(() => {
    fetchCommunities();
    if (id) {
      fetchPostDetails();
    }
  }, [id]);

  const fetchCommunities = async () => {
    try {
      const response = await apiClient.get('/fakbok/communities');
      setCommunities(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching communities:', error);
    }
  };

  const fetchPostDetails = async () => {
    try {
      const response = await apiClient.get(`/fakbok/posts/${id}`);
      setTitle(response.data.title);
      setBody(response.data.body);
      setCommunityName(response.data.community.name);
    } catch (error) {
      console.error('Error fetching post details:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('body', body);
    formData.append('communityName', communityName);
    if (media) {
      formData.append('media', media);
    }

    try {
      if (id) {
        await apiClient.put(`/fakbok/posts/${id}`, formData);
      } else {
        await apiClient.post('/fakbok/posts/create', formData);
      }
      navigate('/');
    } catch (error) {
      console.error('Error saving post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/fakbok/communities/create', newCommunityData);
      setCommunityName(newCommunityData.name);
      setShowCreateCommunity(false);
      fetchCommunities();
    } catch (error) {
      console.error('Error creating community:', error);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        {id ? 'Edit Post' : 'Create New Post'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-700 font-medium mb-2">Community</label>
          <div className="flex space-x-4">
            <select
              value={communityName}
              onChange={(e) => setCommunityName(e.target.value)}
              className="flex-grow p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            >
              <option value="">Select a community</option>
              {communities.map((community) => (
                <option key={community.id} value={community.name}>
                  {community.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowCreateCommunity(true)}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
            >
              New Community
            </button>
          </div>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder-gray-500"
            placeholder="Enter post title"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">Content</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[200px] text-black placeholder-gray-500"
            placeholder="Write your post content here..."
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">Media (optional)</label>
          <input
            type="file"
            onChange={(e) => setMedia(e.target.files[0])}
            className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            accept="image/*,video/*"
          />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition disabled:opacity-50"
          >
            {loading ? 'Saving...' : id ? 'Update Post' : 'Create Post'}
          </button>
        </div>
      </form>

      {/* Create Community Modal */}
      {showCreateCommunity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Create New Community</h2>
            <form onSubmit={handleCreateCommunity} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={newCommunityData.name}
                  onChange={(e) =>
                    setNewCommunityData({ ...newCommunityData, name: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded text-black"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Description</label>
                <textarea
                  value={newCommunityData.description}
                  onChange={(e) =>
                    setNewCommunityData({ ...newCommunityData, description: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded text-black"
                  required
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowCreateCommunity(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Create Community
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateEditPost;
