import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Avatar } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

const ProfilePage = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = auth.getToken();
        if (!token) {
          throw new Error('No authentication token found');
        }
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/user/${username}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfileData(response.data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError('Failed to load profile data. Please try again.');
        setLoading(false);
      }
    };

    if (auth.user) {
      fetchProfileData();
    } else {
      setLoading(false);
      setError('User not authenticated');
    }
  }, [username, auth]);

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  if (!profileData) return <div className="flex justify-center items-center h-screen">Profile not found</div>;

  const isOwnProfile = auth.user && auth.user.username === username;

  const handleEditProfile = () => {
    navigate('/edit-profile');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardHeader className="pb-0">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <img src={profileData.avatar || "/placeholder-user.jpg"} alt={username} className="h-full w-full object-cover" />
              <span className="absolute inset-0 flex items-center justify-center text-lg font-medium text-white bg-gray-400">
                {username.charAt(0).toUpperCase()}
              </span>
            </Avatar>
            <div>
              <CardTitle className="text-2xl font-bold">{profileData.firstName} {profileData.lastName}</CardTitle>
              <p className="text-sm text-muted-foreground">@{username}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mt-4 space-y-4">
            <div className="text-sm text-muted-foreground">
              Joined {formatDate(profileData.joinDate)}
            </div>
            {profileData.birthday && (
              <div className="text-sm">
                <span className="font-medium">Birthday:</span> {formatDate(profileData.birthday)}
              </div>
            )}
            {profileData.interest && (
              <div className="text-sm">
                <span className="font-medium">Interested in:</span> {profileData.interest}
              </div>
            )}
            {profileData.school && (
              <div className="text-sm">
                <span className="font-medium">School:</span> {profileData.school.name} ({profileData.school.type})
              </div>
            )}
            {profileData.faculty && (
              <div className="text-sm">
                <span className="font-medium">Faculty:</span> {profileData.faculty}
              </div>
            )}
            <div className="text-sm">
              <span className="font-medium">Profile views:</span> {profileData.uniqueViewers}
            </div>
          </div>
          
          {profileData.biography && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-2">About</h2>
              <p className="text-muted-foreground">{profileData.biography}</p>
            </div>
          )}
          
          {isOwnProfile && (
            <div className="mt-6">
              <Button variant="outline" onClick={handleEditProfile}>
                Edit Profile
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;