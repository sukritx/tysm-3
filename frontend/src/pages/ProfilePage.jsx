import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Avatar } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { InstagramIcon } from 'lucide-react';
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";

const ProfilePage = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [friendStatus, setFriendStatus] = useState(null);
  const [message, setMessage] = useState('');
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [coinBalance, setCoinBalance] = useState(0);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = auth.getToken();
        if (!token) {
          throw new Error('No authentication token found');
        }
        console.log('Fetching profile data for:', username);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/user/${username}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Profile data received:", response.data);
        setProfileData(response.data.data);
        setFriendStatus(response.data.data.friendStatus);
        console.log("Friend status set to:", response.data.data.friendStatus);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching profile data:', err);
        console.error('Error details:', err.response?.data);
        setError('Failed to load profile data. Please try again.');
        setLoading(false);
      }
    };

    const fetchUserData = async () => {
      try {
        const token = auth.getToken();
        if (!token) {
          throw new Error('No authentication token found');
        }
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/user/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCoinBalance(response.data.user.coinBalance);
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };

    if (auth.user) {
      fetchProfileData();
      fetchUserData();
    } else {
      setLoading(false);
      setError('User not authenticated');
    }
  }, [username, auth]);

  const handleEditProfile = () => {
    navigate('/edit-profile');
  };

  const handleFriendAction = async (action) => {
    try {
      const token = auth.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      if (!profileData || !profileData._id) {
        throw new Error('Profile data is not available');
      }
      const endpoint = action === 'add' ? 'add' : action === 'accept' ? 'accept' : 'unfriend';
      await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/user/${endpoint}/${profileData._id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh profile data after action
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/user/${username}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfileData(response.data.data);
      setFriendStatus(response.data.data.friendStatus);
    } catch (err) {
      console.error('Error performing friend action:', err);
      setError('Failed to perform action. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) ? date.toLocaleDateString() : 'Invalid Date';
  };

  const handleSendMessage = async () => {
    try {
      const token = auth.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/message/${profileData._id}`, 
        { message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessageSent(true);
      setMessage('');
      // Refresh user data to get updated coin balance
      const userResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/user/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCoinBalance(userResponse.data.user.coinBalance);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    }
  };

  const renderWhoViewed = () => {
    if (!profileData.whoView || profileData.whoView.length === 0) return null;
    return (
      <Card className="mt-6 border-2 border-yellow-500">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recent Profile Viewers</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {profileData.whoView.map((view, index) => (
              <li key={index} className="text-sm">
                <Link to={`/${view.username}`} className="text-blue-500 hover:underline">
                  {view.username}
                </Link>
                {' - '}{new Date(view.viewDate).toLocaleDateString()}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    );
  };

  const renderUnlockWhoViewed = () => {
    return (
      <Card className="mt-6 border-2 border-yellow-500">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Who Viewed Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400 mb-2">Unlock this feature with VIP status!</p>
          <Link to="/sales">
            <Button variant="outline" className="w-full">
              Unlock Who Viewed
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  };

  const renderTodaysClubs = () => {
    if (!profileData.todaysClubs || profileData.todaysClubs.length === 0) return null;
    return (
      <div className="mt-4 text-sm">
        <span className="font-medium text-yellow-500">Going to:</span> 
        {profileData.todaysClubs.map((club, index) => (
          <span key={club._id} className="text-yellow-500">
            {' '}{club.clubName}
            {index < profileData.todaysClubs.length - 1 ? ',' : ''}
          </span>
        ))}
      </div>
    );
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  if (!profileData) return <div className="flex justify-center items-center h-screen">Profile not found</div>;

  const isOwnProfile = auth.user && auth.user.username === username;
  const isVip = auth.user && auth.user.vipLevel > 0; // Assuming vipLevel is available in user object

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardHeader className="pb-0">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              {profileData.avatar ? (
                <img 
                  src={profileData.avatar} 
                  alt={username} 
                  className="h-full w-full object-cover" 
                  onError={(e) => {
                    console.error("Error loading avatar:", e);
                    e.target.onerror = null; 
                    e.target.src = "/placeholder-user.jpg";
                  }}
                />
              ) : (
                <span className="flex items-center justify-center text-lg font-medium text-white bg-gray-400 h-full w-full">
                  {username.charAt(0).toUpperCase()}
                </span>
              )}
            </Avatar>
            <div>
              <CardTitle className="text-2xl font-bold">{profileData.firstName} {profileData.lastName}</CardTitle>
              <p className="text-sm text-muted-foreground">@{username}</p>
              {profileData.instagram && (
                <a href={`https://instagram.com/${profileData.instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center mt-1 text-sm text-blue-500 hover:underline">
                  <InstagramIcon size={16} className="mr-1" />
                  {profileData.instagram}
                </a>
              )}
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
          
          <div className="mt-6">
            {isOwnProfile ? (
              <Button variant="outline" onClick={handleEditProfile}>
                Edit Profile
              </Button>
            ) : (
              <>
                {friendStatus === 'not_friends' && (
                  <Button onClick={() => handleFriendAction('add')}>
                    Add Friend
                  </Button>
                )}
                {friendStatus === 'pending_sent' && (
                  <Button disabled>
                    Friend Request Sent
                  </Button>
                )}
                {friendStatus === 'pending_received' && (
                  <Button onClick={() => handleFriendAction('accept')}>
                    Accept Friend Request
                  </Button>
                )}
                {friendStatus === 'friends' && (
                  <Button variant="outline" onClick={() => handleFriendAction('unfriend')}>
                    Unfriend
                  </Button>
                )}
                {friendStatus === undefined && (
                  <p>Friend status is undefined</p>
                )}
                <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="ml-2">
                      Send Message
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Send Message to {username}</DialogTitle>
                    </DialogHeader>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message here..."
                      className="mt-2"
                    />
                    <Button onClick={handleSendMessage} disabled={!message.trim() || coinBalance < 1}>
                      Send (1 Coin)
                    </Button>
                    {messageSent && <p className="text-green-500 mt-2">Message sent successfully!</p>}
                    {coinBalance < 1 && <p className="text-red-500 mt-2">Insufficient coins to send message</p>}
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>

          {isOwnProfile && (
            isVip ? renderWhoViewed() : renderUnlockWhoViewed()
          )}
          {!isOwnProfile && renderTodaysClubs()}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;