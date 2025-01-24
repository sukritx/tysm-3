import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../config/api';

const CreateEditCommunity = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rules: [],
    banner: null,
    logo: null
  });

  useEffect(() => {
    if (id) {
      fetchCommunityDetails();
    }
  }, [id]);

  const fetchCommunityDetails = async () => {
    try {
      const response = await apiClient.get(`/fakbok/communities/${id}`);
      setFormData({
        name: response.data.name,
        description: response.data.description,
        rules: response.data.rules || [],
        banner: response.data.banner,
        logo: response.data.logo
      });
    } catch (error) {
      console.error('Error fetching community details:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const submitData = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null) {
        submitData.append(key, formData[key]);
      }
    });

    try {
      if (id) {
        await apiClient.put(`/fakbok/communities/${id}`, submitData);
      } else {
        await apiClient.post('/fakbok/communities/create', submitData);
      }
      navigate('/communities');
    } catch (error) {
      console.error('Error saving community:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        {id ? 'Edit Community' : 'Create New Community'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-700 font-medium mb-2">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded text-black"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded text-black min-h-[100px]"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">Banner Image</label>
          <input
            type="file"
            onChange={(e) => setFormData({ ...formData, banner: e.target.files[0] })}
            className="w-full p-3 border border-gray-300 rounded"
            accept="image/*"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">Logo</label>
          <input
            type="file"
            onChange={(e) => setFormData({ ...formData, logo: e.target.files[0] })}
            className="w-full p-3 border border-gray-300 rounded"
            accept="image/*"
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
            {loading ? 'Saving...' : id ? 'Update Community' : 'Create Community'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEditCommunity;
