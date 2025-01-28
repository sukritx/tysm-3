import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../config/api';
import debounce from 'lodash/debounce';
import { useAuth } from '../../context/AuthContext';

const CreateEditPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [communityName, setCommunityName] = useState('');
  const [communitySearch, setCommunitySearch] = useState('');
  const [communities, setCommunities] = useState([]);
  const [showCommunityResults, setShowCommunityResults] = useState(false);
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [newCommunityData, setNewCommunityData] = useState({
    name: '',
    description: '',
    rules: [''],
  });

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery) => {
      try {
        const response = await apiClient.get(`/fakbok/communities/search?query=${searchQuery}`);
        setCommunities(response.data);
      } catch (error) {
        console.error('Error searching communities:', error);
      }
    }, 300),
    []
  );

  // Handle community search input
  const handleCommunitySearch = (e) => {
    const value = e.target.value;
    setCommunitySearch(value);
    setShowCommunityResults(true);
    if (value.trim()) {
      debouncedSearch(value);
    } else {
      // If search is empty, fetch popular communities
      debouncedSearch('');
    }
  };

  // Handle community selection
  const handleCommunitySelect = (community) => {
    setCommunityName(community.name);
    setCommunitySearch(community.name);
    setShowCommunityResults(false);
  };

  useEffect(() => {
    // Initial fetch of popular communities
    debouncedSearch('');
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
    if (!title || !body || !communityName) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (!user) {
      alert('You must be logged in to create a post');
      navigate('/login'); // Redirect to login page
      return;
    }
    
    setLoading(true);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('body', body);
    
    // Get the community ID from the selected community
    const selectedCommunity = communities.find(c => c.name === communityName);
    if (!selectedCommunity) {
      alert('Please select a valid community');
      setLoading(false);
      return;
    }
    formData.append('community_id', selectedCommunity._id);
    
    // Use the user ID from the auth context
    formData.append('author_id', user.id);

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
      alert(error.response?.data?.error || 'Error creating post');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!newCommunityData.name.trim()) {
      console.error('Community name is required');
      return;
    }

    try {
      const dataToSend = {
        name: newCommunityData.name.trim(),
        description: newCommunityData.description.trim(),
        rules: newCommunityData.rules.filter(rule => rule.trim()),
        moderators: []
      };

      const response = await apiClient.post('/fakbok/communities/create', dataToSend);
      console.log('Community created successfully:', response.data);
      setCommunityName(dataToSend.name);
      setShowCreateCommunity(false);
      fetchCommunities();
    } catch (error) {
      console.error('Error creating community:', error);
      if (error.response) {
        // Log the detailed error response
        console.error('Error details:', error.response.data);
      }
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">
        {id ? 'Edit Post' : 'Create New Post'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Community Search Section */}
        <div className="relative">
          <label className="block text-gray-700 font-medium mb-2">Community</label>
          <input
            type="text"
            value={communitySearch}
            onChange={handleCommunitySearch}
            onFocus={() => setShowCommunityResults(true)}
            className="w-full p-3 border border-gray-300 rounded text-black"
            placeholder="Search for a community..."
          />
          
          {/* Community Search Results */}
          {showCommunityResults && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto">
              {communities.map((community) => (
                <div
                  key={community._id}
                  className="p-3 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleCommunitySelect(community)}
                >
                  <div className="font-medium text-black">{community.name}</div>
                  <div className="text-sm text-gray-500">
                    {community.followersCount} members
                  </div>
                </div>
              ))}
              <div
                className="p-3 text-blue-500 hover:bg-gray-100 cursor-pointer border-t"
                onClick={() => {
                  setShowCreateCommunity(true);
                  setShowCommunityResults(false);
                  setNewCommunityData({ ...newCommunityData, name: communitySearch });
                }}
              >
                Create community "{communitySearch}"
              </div>
            </div>
          )}
        </div>

        {/* Rest of your existing form fields */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded text-black"
            placeholder="Enter post title"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">Content</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded text-black min-h-[200px]"
            placeholder="Write your post content here..."
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">Media (optional)</label>
          <input
            type="file"
            onChange={(e) => setMedia(e.target.files[0])}
            className="w-full p-3 border border-gray-300 rounded"
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
            {loading ? 'Posting...' : id ? 'Update Post' : 'Create Post'}
          </button>
        </div>
      </form>

      {/* Create Community Modal */}
      {showCreateCommunity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h2 className="text-2xl font-bold mb-4">Create New Community</h2>
            <form onSubmit={handleCreateCommunity}>
              <div className="space-y-4">
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
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateCommunity(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
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
