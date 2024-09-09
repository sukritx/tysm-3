import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserRound, Users, Calendar, ArrowLeft, CheckCircle } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Input } from "@/components/ui/input";
import { Link as LinkIcon, Copy } from 'lucide-react';

const Club = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, getToken } = useAuth();
  const [clubData, setClubData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGoingToday, setIsGoingToday] = useState(false); // Initialize to false
  const [inviteLink, setInviteLink] = useState('');
  const [showInviteLink, setShowInviteLink] = useState(false);

  const fetchClubData = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/club/going/${id}`, config);
      setClubData(response.data);

      // Ensure both IDs are strings for comparison
      const userIsGoing = response.data.peopleGoing.some(
        person => String(person.userId) === String(user.id)
      );
      setIsGoingToday(userIsGoing);

      // console.log('Current user ID:', user.id);
      // console.log('People going:', response.data.peopleGoing);
      // console.log('Is user going:', userIsGoing);

    } catch (error) {
      console.error('Error fetching club data:', error.response || error);
      if (error.response && error.response.status === 401) {
        setError('Authentication failed. Please log in again.');
        navigate('/login');
      } else {
        setError(`An error occurred: ${error.response?.data?.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubData();
  }, [id, user, navigate]);

  const handleGoingToday = async () => {
    try {
      const token = await getToken();
      // console.log('Token:', token);
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // console.log('Current user ID:', user.id);
      // console.log('Is user going (before request):', isGoingToday);
      // console.log('Club data before request:', clubData);

      if (isGoingToday) {
        // Undo going to club
        // console.log(`Attempting to undo go for club ${id}`);
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/club/undo-go/${id}`, {}, config);
        // console.log('Undo go response:', response.data);
        toast.success("คุณได้ยกเลิกการไปวันนี้แล้ว");
        setIsGoingToday(false);
        setClubData(prevData => ({
          ...prevData,
          totalGoingToday: prevData.totalGoingToday - 1,
          peopleGoing: prevData.peopleGoing.filter(person => String(person.userId) !== String(user.id))
        }));
      } else {
        // Go to club
        await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/club/go/${id}`, {}, config);
        toast.success("คุณกำลังจะไปวันนี้!");
        setIsGoingToday(true);
        setClubData(prevData => ({
          ...prevData,
          totalGoingToday: prevData.totalGoingToday + 1,
          peopleGoing: [...prevData.peopleGoing, { userId: user.id, username: user.username, isFriend: false }]
        }));
      }

      // console.log('Is user going (after request):', !isGoingToday);
      // console.log('Club data after request:', clubData);
    } catch (error) {
      console.error('Error updating going status:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to update status');
      await fetchClubData();
      // console.log('Club data after re-fetch:', clubData);
    }
  };

  const generateInviteLink = async () => {
    try {
      const token = await getToken();
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/invite/send`, { clubId: id }, config);
      setInviteLink(response.data.inviteUrl);
      setShowInviteLink(true);
    } catch (error) {
      console.error('Error generating invite link:', error);
      toast.error('Failed to generate invite link');
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success('Invite link copied to clipboard!');
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center items-center h-screen text-white"
      >
        กำลังโหลด...
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center items-center h-screen text-red-500"
      >
        {error}
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="container mx-auto p-4 bg-gray-900 min-h-screen"
    >
      <Link to="/">
        <Button className="mb-4 bg-[#00BAFA] hover:bg-[#0095c8] text-white">
          <ArrowLeft className="mr-2 h-4 w-4" /> กลับหน้าหลัก
        </Button>
      </Link>
      
      {clubData && (
        <Card className="bg-gray-800 border-gray-700 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-[#00BAFA] to-[#0095c8] text-white">
            <CardTitle className="text-3xl font-bold">{clubData.clubName}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center mb-4">
                  <Users className="mr-2 h-5 w-5 text-[#00BAFA]" />
                  <p className="text-white text-lg">จำนวนคนที่จะไปวันนี้: {clubData.totalGoingToday}</p>
                </div>
                <div className="flex items-center mb-4">
                  <UserRound className="mr-2 h-5 w-5 text-[#00BAFA]" />
                  <p className="text-white text-lg">เพื่อนที่จะไป: {clubData.friendsGoingCount}</p>
                </div>
                <Button 
                  className={`w-full font-bold py-2 px-4 rounded ${
                    isGoingToday 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-[#00BAFA] hover:bg-[#0095c8] text-white'
                  }`}
                  onClick={handleGoingToday}
                >
                  {isGoingToday ? 'ไม่ไปละ' : 'ไปวันนี้'}
                </Button>
                
                {isGoingToday && (
                  <div className="mt-4">
                    <Button
                      onClick={generateInviteLink}
                      className="w-full bg-green-500 hover:bg-green-600 text-white"
                    >
                      <LinkIcon className="mr-2 h-4 w-4" />
                      สร้างลิงก์เชิญเพื่อน
                    </Button>
                    
                    {showInviteLink && (
                      <div className="mt-2 flex">
                        <Input
                          value={inviteLink}
                          readOnly
                          className="flex-grow bg-gray-700 text-white"
                        />
                        <Button onClick={copyInviteLink} className="ml-2 bg-gray-600 hover:bg-gray-500">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[#00BAFA] mb-4">รายชื่อผู้เข้าร่วม</h3>
                {clubData.peopleGoing.length > 0 ? (
                  <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {clubData.peopleGoing.map((person, index) => (
                      <motion.li 
                        key={person.userId} // Use unique identifier instead of index
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center space-x-3 bg-gray-700 p-2 rounded-lg hover:bg-gray-600 transition duration-300"
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={person.avatar} alt={person.username} />
                          <AvatarFallback>
                            <UserRound className="w-6 h-6" />
                          </AvatarFallback>
                        </Avatar>
                        <Link to={`/${person.username}`} className="flex-grow text-white hover:text-[#00BAFA] transition duration-300">
                          {person.username}
                        </Link>
                        {person.isFriend && <span className="text-xl" role="img" aria-label="Friend">👥✨</span>}
                      </motion.li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-300">ยังไม่มีผู้เข้าร่วม</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};

export default Club;
