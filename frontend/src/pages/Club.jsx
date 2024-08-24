import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserRound } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const Club = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, getToken } = useAuth();
  const [clubData, setClubData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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

    fetchClubData();
  }, [id, user, navigate, getToken]);

  if (loading) return <p className="text-white text-center">กำลังโหลด...</p>;
  if (error) return <p className="text-red-500 text-center">{error}</p>;

  return (
    <div className="container mx-auto p-4 bg-gray-900 min-h-screen">
      <Link to="/">
        <Button className="mb-4 bg-[#00BAFA] hover:bg-[#0095c8] text-white">
          กลับหน้าหลัก
        </Button>
      </Link>
      
      {clubData && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-[#00BAFA]">{clubData.clubName}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white mb-2">จำนวนคนที่จะไปวันนี้: {clubData.totalGoingToday}</p>
            <p className="text-white mb-4">เพื่อนที่จะไป: {clubData.friendsGoingCount}</p>
            
            <h3 className="text-xl font-semibold text-[#00BAFA] mb-2">รายชื่อผู้เข้าร่วม</h3>
            {clubData.peopleGoing.length > 0 ? (
              <ul className="text-white space-y-3">
                {clubData.peopleGoing.map((person, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={person.avatar} alt={person.username} />
                      <AvatarFallback>
                        <UserRound className="w-6 h-6" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-grow">{person.username}</span>
                    {person.isFriend && <span className="text-xl" role="img" aria-label="Friend">👥</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-300">ยังไม่มีผู้เข้าร่วม</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Club;