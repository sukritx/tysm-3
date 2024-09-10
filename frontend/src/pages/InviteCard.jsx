import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UserRound, Calendar, Clock, Users, Frown, Check, AlertCircle, Eye } from 'lucide-react';

const InviteCard = () => {
  const { inviteLink } = useParams();
  const navigate = useNavigate();
  const { user, getToken } = useAuth();
  const [inviteData, setInviteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rejected, setRejected] = useState(false);
  const [alreadyAccepted, setAlreadyAccepted] = useState(false);
  const [responseError, setResponseError] = useState(null);

  useEffect(() => {
    fetchInviteDetails();
  }, [inviteLink, user]);

  const fetchInviteDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/invite/${inviteLink}`);
      setInviteData(response.data);
      
      if (user && response.data.acceptedUsers.some(acceptedUser => acceptedUser.username === user.username)) {
        setAlreadyAccepted(true);
      }
    } catch (error) {
      console.error('Error fetching invite details:', error);
      setError('Failed to load invite details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      const token = await getToken();
      
      if (!token) {
        navigate('/login', { state: { from: `/invite/${inviteLink}` } });
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/invite/respond`,
        { inviteLink, accept: true },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        }
      );

      if (response.data.redirect) {
        navigate(response.data.redirect, { state: { from: `/invite/${inviteLink}` } });
      } else {
        toast.success(response.data.message);
        setAlreadyAccepted(true);
        setResponseError(null);
      }
    } catch (error) {
      console.error('Error accepting invite:', error);
      if (error.response && error.response.data && error.response.data.error) {
        setResponseError(error.response.data.error);
      } else {
        setResponseError('Failed to accept invite. Please try again.');
      }
    }
  };

  const handleDecline = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/v1/invite/respond`,
        { inviteLink, accept: false },
        { withCredentials: true }
      );
      setRejected(true);
      setResponseError(null);
    } catch (error) {
      console.error('Error declining invite:', error);
      if (error.response && error.response.data && error.response.data.error) {
        setResponseError(error.response.data.error);
      } else {
        setResponseError('Failed to decline invite. Please try again.');
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  if (rejected) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="container mx-auto p-4 bg-gray-900 min-h-screen flex items-center justify-center"
      >
        <Card className="w-full max-w-md bg-gray-800 border-gray-700 text-center">
          <CardContent className="p-6">
            <Frown className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Invitation Declined</h2>
            <p className="text-gray-300">We're sorry to see you go. Maybe next time!</p>
            <Button 
              onClick={() => navigate('/')}
              className="mt-4 bg-[#00BAFA] hover:bg-[#0095c8] text-white"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="container mx-auto p-4 bg-gray-900 min-h-screen flex items-center justify-center"
    >
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader className="bg-gradient-to-r from-[#00BAFA] to-[#0095c8] text-white">
          <CardTitle className="text-2xl font-bold">Club Invitation</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={inviteData?.fromAvatar} alt={inviteData?.from} />
                <AvatarFallback><UserRound className="w-6 h-6" /></AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white font-semibold">{inviteData?.from}</p>
                <p className="text-gray-400 text-sm">invites you to join</p>
              </div>
            </div>
            <h3 className="text-xl font-bold text-[#00BAFA]">{inviteData?.clubName}</h3>
            
            <Link to={`/club/${inviteData?.clubId}`}>
              <Button 
                className="w-full bg-[#00BAFA] hover:bg-[#0095c8] text-white my-4"
              >
                <Eye className="mr-2 h-4 w-4" />
                คนไป {inviteData?.clubName} วันนี้
              </Button>
            </Link>

            <div className="flex items-center text-gray-300">
              <Calendar className="mr-2 h-5 w-5" />
              <span>{new Date(inviteData?.date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center text-gray-300">
              <Clock className="mr-2 h-5 w-5" />
              <span>Expires: {new Date(inviteData?.expiresAt).toLocaleString()}</span>
            </div>
            <div className="flex items-center text-gray-300">
              <Users className="mr-2 h-5 w-5" />
              <span>{inviteData?.acceptedUsers.length} people accepted</span>
            </div>
            
            {responseError && (
              <div className="flex items-center space-x-2 bg-red-500 p-4 rounded-md">
                <AlertCircle className="w-6 h-6 text-white" />
                <span className="text-white font-semibold">{responseError}</span>
              </div>
            )}
            
            {alreadyAccepted ? (
              <div className="flex items-center justify-center space-x-2 mt-6 bg-green-500 p-4 rounded-md">
                <Check className="w-6 h-6 text-white" />
                <span className="text-white font-semibold">You've already accepted this invitation</span>
              </div>
            ) : (
              <div className="flex space-x-2 mt-6">
                <Button 
                  onClick={handleAccept}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                >
                  Accept
                </Button>
                <Button 
                  onClick={handleDecline}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  Decline
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default InviteCard;
