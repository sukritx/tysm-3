import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Avatar } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { InstagramIcon, Star, Clock, Users } from 'lucide-react';
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import ReactGA from 'react-ga4';
import { ScrollArea } from "../components/ui/scroll-area";

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
  const [friendsList, setFriendsList] = useState([]);
  const [showFriendsDialog, setShowFriendsDialog] = useState(false);

  const isOwnProfile = auth.user && auth.user.username === username;

  useEffect(() => {
    // Track page view
    ReactGA.send({ hitType: "pageview", page: `/profile/${username}` });

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
        setFriendStatus(response.data.data.friendStatus);
        setLoading(false);
        ReactGA.event({
          category: 'Profile',
          action: 'Fetch Profile Data',
          label: 'Success'
        });
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError('Failed to load profile data. Please try again.');
        setLoading(false);
        ReactGA.event({
          category: 'Profile',
          action: 'Fetch Profile Data',
          label: 'Error'
        });
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
        ReactGA.event({
          category: 'Profile',
          action: 'Fetch User Data',
          label: 'Success'
        });
      } catch (err) {
        console.error('Error fetching user data:', err);
        ReactGA.event({
          category: 'Profile',
          action: 'Fetch User Data',
          label: 'Error'
        });
      }
    };

    const fetchFriendsList = async () => {
      if (isOwnProfile) {
        try {
          const token = auth.getToken();
          if (!token) {
            throw new Error('No authentication token found');
          }
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/user/me/friends`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setFriendsList(response.data.friends);
        } catch (err) {
          console.error('Error fetching friends list:', err);
        }
      }
    };

    if (auth.user) {
      fetchProfileData();
      fetchUserData();
      fetchFriendsList();
    } else {
      setLoading(false);
      setError('User not authenticated');
      ReactGA.event({
        category: 'Profile',
        action: 'View Attempt',
        label: 'Not Authenticated'
      });
    }
  }, [username, auth, isOwnProfile]);

  const handleEditProfile = () => {
    ReactGA.event({
      category: 'Profile',
      action: 'Edit Profile',
      label: username
    });
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
      ReactGA.event({
        category: 'Profile',
        action: `Friend ${action.charAt(0).toUpperCase() + action.slice(1)}`,
        label: 'Success'
      });
    } catch (err) {
      console.error('Error performing friend action:', err);
      setError('Failed to perform action. Please try again.');
      ReactGA.event({
        category: 'Profile',
        action: `Friend ${action.charAt(0).toUpperCase() + action.slice(1)}`,
        label: 'Error'
      });
    }
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
      ReactGA.event({
        category: 'Profile',
        action: 'Send Message',
        label: 'Success'
      });
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
      ReactGA.event({
        category: 'Profile',
        action: 'Send Message',
        label: 'Error'
      });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) ? date.toLocaleDateString() : 'Invalid Date';
  };

  const renderVipStatus = () => {
    if (!profileData.vipStatus || !profileData.vipStatus.isVip) return null;
    
    return (
      <Card className="mt-6 bg-gradient-to-r from-yellow-400 to-yellow-200 text-black">
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-bold">
            <Star className="mr-2" /> VIP user
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-semibold">Exclusive member</p>
          {isOwnProfile && profileData.vipStatus.vipExpire && (
            <p className="text-sm mt-2">
              <Clock className="inline mr-1" />
              Expires on: {new Date(profileData.vipStatus.vipExpire).toLocaleDateString()}
            </p>
          )}
          {!isOwnProfile && (
            <Link to="/sales">
              <Button className="mt-4 bg-black text-yellow-400 hover:bg-gray-800">
                become VIP
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderProfileViewers = () => {
    if (!profileData.whoView || profileData.whoView.length === 0) return null;
    return (
      <Card className="mt-6 border-2 border-yellow-500">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <Users className="mr-2" /> Recent Profile Viewers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {profileData.whoView.map((view, index) => (
              <li key={index} className="text-sm">
                <Link to={`/${view.username}`} className="text-blue-500 hover:underline" onClick={() => {
                  ReactGA.event({
                    category: 'Profile',
                    action: 'View User Profile',
                    label: view.username
                  });
                }}>
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

  const renderUnlockProfileViewers = () => {
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
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2 text-yellow-500">Today going to</h3>
        <ul className="list-disc pl-5">
          {profileData.todaysClubs.map((club) => (
            <li key={club._id} className="text-sm text-yellow-500">
              {club.clubName}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderFriendsList = () => {
    if (!isOwnProfile || friendsList.length === 0) return null;
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <Users className="mr-2" /> Friends ({friendsList.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Dialog open={showFriendsDialog} onOpenChange={setShowFriendsDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => {
                ReactGA.event({
                  category: 'Profile',
                  action: 'View Friends List',
                  label: username
                });
              }}>
                View All Friends
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Friends List</DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                <ul className="space-y-2">
                  {friendsList.map((friend) => (
                    <li key={friend._id} className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <img src={friend.avatar} alt={friend.username} onError={(e) => {
                          e.target.onerror = null; 
                          e.target.src = "/placeholder-user.jpg";
                        }} />
                      </Avatar>
                      <Link to={`/${friend.username}`} className="text-blue-500 hover:underline" onClick={() => {
                        setShowFriendsDialog(false);
                        ReactGA.event({
                          category: 'Profile',
                          action: 'View Friend Profile',
                          label: friend.username
                        });
                      }}>
                        {friend.username}
                      </Link>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  if (!profileData) return <div className="flex justify-center items-center h-screen">Profile not found</div>;

  const isVip = profileData.vipStatus && profileData.vipStatus.isVip;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card className="overflow-hidden">
        <CardHeader className="pb-0">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              {profileData.avatar ? (
                <img 
                  src={profileData.avatar} 
                  alt={username} 
                  className="h-full w-full object-cover" 
                  onError={(e) => {
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
            <div className="flex flex-col">
              <div className="flex items-center">
                <CardTitle className="text-2xl font-bold mr-2">
                  @{username}
                </CardTitle>
                {isVip && (
                  <Badge variant="secondary" className="bg-yellow-400 text-black text-xs">
                    <Star className="mr-1 h-3 w-3" /> VIP
                  </Badge>
                )}
              </div>
              {profileData.instagram && (
                <a href={`https://instagram.com/${profileData.instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center mt-1 text-sm text-blue-500 hover:underline">
                  <InstagramIcon size={16} className="mr-1" />
                  {profileData.instagram}
                </a>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="mt-4">
          <div className="space-y-4">
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
              <span className="font-medium">Profile views:</span> {profileData.totalViews}
            </div>
          </div>
          
          {profileData.biography && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-2">About</h2>
              <p className="text-muted-foreground">{profileData.biography}</p>
            </div>
          )}
          
          <div className="mt-6 flex space-x-2">
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
                <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" onClick={() => {
                      ReactGA.event({
                        category: 'Profile',
                        action: 'Open Message Dialog',
                        label: username
                      });
                    }}>
                      Ghost Message
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Send Ghost Message to {username}</DialogTitle>
                    </DialogHeader>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="พิมพ์ข้อความที่ต้องการส่งแบบไม่ระบุตัวตน"
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

          {isVip && renderVipStatus()}
          {isOwnProfile && (isVip ? renderProfileViewers() : renderUnlockProfileViewers())}
          {renderTodaysClubs()}
          {renderFriendsList()}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;