import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import debounce from 'lodash.debounce';
import { ChevronDown, ChevronUp, Check, Upload } from 'lucide-react';

export default function EditProfile() {
  const [profile, setProfile] = useState({
    avatar: '',
    biography: '',
    instagram: '',
    school: '',
    birthday: '',
    interest: '',
    username: '', // Added username to the profile state
  });
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState([]);
  const [filteredSchools, setFilteredSchools] = useState([]);
  const [schoolSearch, setSchoolSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const auth = useAuth();
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    const fetchProfileAndSchools = async () => {
      try {
        const token = auth.getToken();
        if (!token) throw new Error('No authentication token found');
        
        const [profileResponse, schoolsResponse] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/v1/user/me`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/v1/user/schools`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        const userData = profileResponse.data.user;
        setProfile(userData);
        setSchools(schoolsResponse.data.schools);
        setFilteredSchools(schoolsResponse.data.schools);
        
        // Set the current school
        const currentSchool = schoolsResponse.data.schools.find(school => school._id === userData.school);
        if (currentSchool) {
          setSelectedSchool(currentSchool);
          setSchoolSearch(currentSchool.schoolName);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        showToast("Failed to fetch profile data", "error");
        setLoading(false);
      }
    };

    fetchProfileAndSchools();
  }, [auth]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSchoolSearch = debounce((searchTerm) => {
    const lowerCaseTerm = searchTerm.toLowerCase();
    const filtered = schools.filter(school => 
      school.schoolName.toLowerCase().includes(lowerCaseTerm) ||
      school.schoolType.toLowerCase().includes(lowerCaseTerm)
    );
    setFilteredSchools(filtered);
  }, 300);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.substr(0, 5) === "image") {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
      showToast("Please select an image file", "error");
    }
  };

  const handleSchoolSelect = (school) => {
    setSelectedSchool(school);
    setProfile(prev => ({ ...prev, school: school._id }));
    setSchoolSearch(school.schoolName);
    setIsOpen(false);
  };

  const handleAvatarUpload = async () => {
    if (!selectedFile) {
      showToast("Please select an image to upload", "error");
      return;
    }

    const formData = new FormData();
    formData.append('avatar', selectedFile);

    try {
      const token = auth.getToken();
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/user/upload-avatar`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      setProfile(prev => ({ ...prev, avatar: response.data.avatar }));
      setPreviewUrl(null);
      setSelectedFile(null);
      showToast("Profile picture updated successfully");
    } catch (error) {
      console.error('Error uploading avatar:', error);
      showToast("Failed to upload profile picture", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setIsSubmitting(true);
    try {
      const token = auth.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
  
      const updatedProfile = {
        biography: profile.biography || null,
        instagram: profile.instagram || null,
        school: selectedSchool ? selectedSchool._id : null,
        birthday: profile.birthday ? new Date(profile.birthday).toISOString().split('T')[0] : null,
        interest: profile.interest || null,
      };
  
      console.log('Sending updated profile:', updatedProfile);
  
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/v1/user/update`,
        updatedProfile,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
  
      if (response.status === 200) {
        showToast("Profile updated successfully");
        navigate(`/${profile.username}`);
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error.response?.data || error);
      if (error.response?.data?.details) {
        console.error('Validation errors:', error.response.data.details);
      }
      showToast(error.response?.data?.error || "Failed to update profile", "error");
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  if (loading) return <div className="flex justify-center items-center h-screen text-gray-800 dark:text-gray-200">Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      {toast && (
        <div className={`fixed top-4 right-4 p-4 rounded-md ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'} text-white`}>
          {toast.message}
        </div>
      )}
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Edit Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
      <div>
          <label htmlFor="avatar" className="block text-sm font-medium text-gray-500 dark:text-gray-400">Profile Picture</label>
          <div className="mt-1 flex items-center">
            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="object-cover w-full h-full" />
              ) : profile.avatar ? (
                <img src={profile.avatar} alt="Profile" className="object-cover w-full h-full" />
              ) : (
                <div className="text-gray-500 dark:text-gray-400 flex justify-center items-center h-full">No Image</div>
              )}
            </div>
            <div className="ml-4 flex flex-col space-y-2">
              <Button 
                type="button"
                onClick={() => fileInputRef.current.click()} 
                className="bg-gray-800 text-white hover:bg-gray-700 cursor-pointer"
              >
                <Upload className="mr-2 h-4 w-4" />
                Select Image
              </Button>
              {selectedFile && (
                <Button 
                  type="button"
                  onClick={handleAvatarUpload} 
                  className="bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                >
                  Upload Image
                </Button>
              )}
              <Input
                type="file"
                id="avatar"
                name="avatar"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                ref={fileInputRef}
              />
            </div>
          </div>
        </div>
        <div>
          <label htmlFor="biography" className="block text-sm font-medium text-gray-500 dark:text-gray-400">Biography</label>
          <Textarea
            id="biography"
            name="biography"
            value={profile.biography}
            onChange={handleChange}
            className="mt-1"
            rows={3}
          />
        </div>
        <div>
          <label htmlFor="instagram" className="block text-sm font-medium text-gray-500 dark:text-gray-400">Instagram</label>
          <Input
            type="text"
            id="instagram"
            name="instagram"
            value={profile.instagram}
            onChange={handleChange}
            className="mt-1"
          />
        </div>
        <div className="max-w-md mx-auto mb-8" ref={dropdownRef}>
          <label htmlFor="school" className="block text-sm font-medium text-gray-500 dark:text-gray-400">School</label>
          <div className="relative">
            <Button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="w-full justify-between bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
            >
              {selectedSchool ? selectedSchool.schoolName : "Select a school"}
              {isOpen ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
            </Button>
            {isOpen && (
              <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg">
                <Input
                  type="text"
                  placeholder="Search for a school..."
                  value={schoolSearch}
                  onChange={(e) => {
                    setSchoolSearch(e.target.value);
                    handleSchoolSearch(e.target.value);
                  }}
                  className="m-2 w-[calc(100%-1rem)] bg-gray-700 text-white"
                />
                <ul className="max-h-60 overflow-auto">
                  {filteredSchools.map((school) => (
                    <li
                      key={school._id}
                      className="px-4 py-2 hover:bg-gray-700 cursor-pointer flex items-center"
                      onClick={() => handleSchoolSelect(school)}
                    >
                      {school.schoolName} ({school.schoolType})
                      {selectedSchool && selectedSchool._id === school._id && (
                        <Check className="ml-auto h-4 w-4 text-[#00BAFA]" />
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        <div>
          <label htmlFor="birthday" className="block text-sm font-medium text-gray-500 dark:text-gray-400">Birthday</label>
          <Input
            type="date"
            id="birthday"
            name="birthday"
            value={profile.birthday}
            onChange={handleChange}
            className="mt-1"
          />
        </div>
        <div>
          <label htmlFor="interest" className="block text-sm font-medium text-gray-500 dark:text-gray-400">Interest</label>
          <Input
            type="text"
            id="interest"
            name="interest"
            value={profile.interest}
            onChange={handleChange}
            className="mt-1"
            maxLength={20}
          />
        </div>
        <Button 
          type="submit" 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300"
          disabled={loading || isSubmitting}
        >
          {loading || isSubmitting ? 'Updating...' : 'Update Profile'}
        </Button>
      </form>
    </div>
  );
}