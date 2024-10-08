import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ReactGA from 'react-ga4';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ArrowLeft, Check } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import CustomToast from '../components/CustomToast';

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const { getToken, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Track page view
    ReactGA.send({ hitType: "pageview", page: "/messages" });
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser);
      markMessagesAsRead(selectedUser);
      ReactGA.event({
        category: 'Messages',
        action: 'Select Conversation',
        label: selectedUser
      });
    }
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/message/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(response.data.conversations || []);
      setLoading(false);
      ReactGA.event({
        category: 'Messages',
        action: 'Fetch Conversations',
        label: 'Success'
      });
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setError('Failed to load conversations. Please try again.');
      setLoading(false);
      ReactGA.event({
        category: 'Messages',
        action: 'Fetch Conversations',
        label: 'Error'
      });
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const token = getToken();
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/message/all-messages/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data);
      await markMessagesAsRead(userId);
      ReactGA.event({
        category: 'Messages',
        action: 'Fetch Messages',
        label: 'Success'
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages. Please try again.');
      ReactGA.event({
        category: 'Messages',
        action: 'Fetch Messages',
        label: 'Error'
      });
    }
  };

  const markMessagesAsRead = async (userId) => {
    try {
      const token = getToken();
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/v1/message/mark-as-read/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(prevMessages => prevMessages.map(msg => 
        msg.sender === userId ? { ...msg, read: true } : msg
      ));
      setConversations(prevConversations => 
        prevConversations.map(conv => 
          conv.userId === userId ? { ...conv, unreadCount: 0 } : conv
        )
      );
      ReactGA.event({
        category: 'Messages',
        action: 'Mark Messages as Read',
        label: 'Success'
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
      ReactGA.event({
        category: 'Messages',
        action: 'Mark Messages as Read',
        label: 'Error'
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    try {
      const token = getToken();
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/message/${selectedUser}`, 
        { message: newMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewMessage('');
      fetchMessages(selectedUser);
      fetchConversations();
      ReactGA.event({
        category: 'Messages',
        action: 'Send Message',
        label: 'Success'
      });
    } catch (error) {
      console.error('Error sending message:', error);
      if (error.response && error.response.data && error.response.data.errorCode === 'INSUFFICIENT_COINS') {
        toast.custom((t) => (
          <CustomToast
            t={t}
            message="เหรียญหมดง่า เติมเหรียญก่อนนน"
            icon="💰"
          />
        ));
        ReactGA.event({
          category: 'Messages',
          action: 'Send Message',
          label: 'Insufficient Coins'
        });
      } else {
        toast.custom((t) => (
          <CustomToast
            t={t}
            message="Failed to send message. Please try again."
            icon="❌"
          />
        ));
        ReactGA.event({
          category: 'Messages',
          action: 'Send Message',
          label: 'Error'
        });
      }
    }
  };

  const formatMessageTime = (timeString) => {
    if (!timeString) return 'Unknown time';
    const date = new Date(timeString);
    return format(date, 'MMM d, yyyy HH:mm');
  };

  const renderMessage = (msg) => {
    const isFromCurrentUser = msg.isFromCurrentUser;
    return (
      <div key={msg._id} className={`mb-4 flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[70%] ${isFromCurrentUser ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-lg p-3 relative`}>
          <p>{msg.message}</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-400">
              {formatMessageTime(msg.createdAt)}
            </p>
            {msg.read && isFromCurrentUser && (
              <Check className="w-4 h-4 text-green-500 ml-2" />
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="p-4">Loading conversations...</div>;
  }

  if (error) {
    return <div className="p-4">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 h-screen flex flex-col">
      <div className="flex flex-col md:flex-row h-full">
        <div className={`w-full md:w-1/3 md:pr-4 ${selectedUser ? 'hidden md:block' : 'block'}`}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Conversations</CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto">
              {conversations.length === 0 ? (
                <p>No conversations yet.</p>
              ) : (
                conversations.map((conv) => (
                  <div 
                    key={conv.userId} 
                    className={`flex items-center p-2 cursor-pointer ${selectedUser === conv.userId ? 'bg-gray-100' : ''}`}
                    onClick={() => {
                      setSelectedUser(conv.userId);
                      ReactGA.event({
                        category: 'Messages',
                        action: 'Select Conversation',
                        label: conv.userId
                      });
                    }}
                  >
                    <div className="flex-grow">
                      <p className="font-semibold">Anonymous User</p>
                      <p className="text-sm text-gray-500">{conv.lastMessage}</p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <div className="bg-blue-500 text-white rounded-full px-2 py-1 text-xs">
                        {conv.unreadCount}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
        <div className={`w-full md:w-2/3 h-full flex flex-col ${selectedUser ? 'block' : 'hidden md:block'}`}>
          <Card className="h-full flex flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center">
                <Button 
                  variant="ghost" 
                  className="md:hidden mr-2" 
                  onClick={() => {
                    setSelectedUser(null);
                    ReactGA.event({
                      category: 'Messages',
                      action: 'Close Conversation',
                      label: selectedUser
                    });
                  }}
                >
                  <ArrowLeft />
                </Button>
                <CardTitle>
                  {selectedUser 
                    ? `Chat with Anonymous User` 
                    : 'Select a conversation'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-grow overflow-y-auto">
              {messages.map(renderMessage)}
              <div ref={messagesEndRef} />
            </CardContent>
            {selectedUser && (
              <div className="p-4 border-t">
                <div className="flex">
                  <Input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-grow mr-2"
                  />
                  <Button onClick={() => {
                    sendMessage();
                    ReactGA.event({
                      category: 'Messages',
                      action: 'Send Message Button Click',
                      label: selectedUser
                    });
                  }}>Send (1 coin)</Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Messages;