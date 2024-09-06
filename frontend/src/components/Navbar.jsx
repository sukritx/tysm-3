import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from "@/components/ui/button";
import { NavigationMenu, NavigationMenuList, NavigationMenuLink } from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import axios from 'axios';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import tysmLogo from "../assets/tysm-logo.png";
import { Search, Instagram, Bell, Coins, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout, getToken } = useAuth();
  const [avatar, setAvatar] = useState(null);
  const [username, setUsername] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [coinBalance, setCoinBalance] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const token = getToken();
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/user/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setAvatar(response.data.user.avatar);
          setUsername(response.data.user.username);
          setCoinBalance(response.data.user.coinBalance);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    fetchUserData();
  }, [user, getToken]);

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.trim() === '') {
        setSearchResults([]);
        return;
      }

      try {
        const token = getToken();
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/user`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { filter: searchQuery }
        });
        setSearchResults(response.data.users);
      } catch (error) {
        console.error('Error searching users:', error);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, getToken]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (user) {
        try {
          const token = getToken();
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/notification`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setNotifications(response.data);
        } catch (error) {
          console.error('Error fetching notifications:', error);
        }
      }
    };

    fetchNotifications();
  }, [user, getToken]);

  useEffect(() => {
    const fetchUnreadMessages = async () => {
      if (user) {
        try {
          const token = getToken();
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/message/unread-count`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUnreadMessages(response.data.unreadCount);
        } catch (error) {
          console.error('Error fetching unread messages:', error);
        }
      }
    };

    fetchUnreadMessages();
  }, [user, getToken]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.read) {
        const token = getToken();
        await axios.put(`${import.meta.env.VITE_API_URL}/api/v1/notification/${notification._id}/read`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Update the local state to reflect the change
        setNotifications(prevNotifications => 
          prevNotifications.map(n => n._id === notification._id ? { ...n, read: true } : n)
        );
      }

      // Navigate to the sender's profile page
      if (notification.notificationType === "receivedFriendRequest" || notification.notificationType === "friendAdded") {
        navigate(`/${notification.sender.username}`);
      }

      // Close the notifications dropdown
      setShowNotifications(false);
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const goToSalesPage = () => {
    navigate('/sales');
  };

  return (
    <header className="flex h-20 w-full shrink-0 items-center px-4 md:px-6 bg-gray-900 relative z-10">
      <Link to="/" className="mr-6 flex items-center">
        <img src={tysmLogo} alt="TYSM Logo" className="h-8 w-auto" />
        <span className="sr-only">TYSM</span>
      </Link>
      <NavigationMenu className="hidden lg:flex">
        <NavigationMenuList>
          {['Home', 'About', 'Features', 'Pricing', 'Contact'].map((item) => (
            <NavigationMenuLink key={item} asChild>
              <Link
                to={`/${item.toLowerCase()}`}
                className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-gray-800 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-700 hover:text-gray-100 focus:bg-gray-700 focus:text-gray-100 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-gray-700/50 data-[state=open]:bg-gray-700/50 text-gray-300"
              >
                {item}
              </Link>
            </NavigationMenuLink>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
      <div className="ml-auto flex gap-2 items-center">
        {user && (
          <>
            <div 
              className="flex items-center mr-4 text-[#00BAFA] cursor-pointer hover:text-[#0095c8] transition-colors duration-200"
              onClick={goToSalesPage}
              title="Buy Coins"
            >
              <Coins className="w-5 h-5 mr-1" />
              <span>{coinBalance}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/messages')}
              className="text-gray-400 hover:text-white hover:bg-gray-800 transition-colors duration-200 relative"
            >
              <MessageSquare className="h-5 w-5" />
              {unreadMessages > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                  {unreadMessages}
                </span>
              )}
            </Button>
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNotifications(!showNotifications)}
                className={cn(
                  "text-gray-400 hover:text-white hover:bg-gray-800 transition-colors duration-200",
                  showNotifications && "bg-gray-800 text-white"
                )}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </Button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto z-50">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div 
                        key={notification._id} 
                        className={cn(
                          "px-4 py-2 text-sm cursor-pointer",
                          notification.read 
                            ? "bg-gray-800 text-gray-400 hover:bg-gray-700" 
                            : "bg-gray-700 text-white font-semibold hover:bg-gray-600"
                        )}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <p>{notification.notificationType === "receivedFriendRequest" 
                            ? `${notification.sender.username} sent you a friend request` 
                            : `${notification.sender.username} accepted your friend request`}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-sm text-gray-400">No notifications</div>
                  )}
                </div>
              )}
            </div>
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSearch(!showSearch)}
                className={cn(
                  "text-gray-400 hover:text-white hover:bg-gray-800 transition-colors duration-200",
                  showSearch && "bg-gray-800 text-white"
                )}
              >
                <Search className="h-5 w-5" />
              </Button>
              {showSearch && (
                <div className="absolute right-0 mt-2 w-64 z-50">
                  <Input
                    type="search"
                    placeholder="Search users..."
                    className="w-full bg-gray-800 text-white border-gray-700"
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                  {searchResults.length > 0 && (
                    <div className="mt-2 bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {searchResults.map((user) => (
                        <Link
                          key={user.userId}
                          to={`/${user.username}`}
                          className="flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
                          onClick={() => setShowSearch(false)}
                        >
                          <Avatar className="h-8 w-8 mr-2">
                            {user.avatar ? (
                              <img src={user.avatar} alt={user.username} className="h-full w-full object-cover" />
                            ) : (
                              <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                            )}
                          </Avatar>
                          <div className="flex flex-col">
                            <span>{user.username}</span>
                            {user.instagram && (
                              <span className="text-xs text-gray-400 flex items-center">
                                <Instagram className="h-3 w-3 mr-1" />
                                {user.instagram}
                              </span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Avatar>
                {avatar ? (
                  <img src={avatar} alt={username} className="h-full w-full object-cover" />
                ) : (
                  <AvatarFallback className="bg-gray-700 text-gray-100">
                    {username.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                )}
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-800 text-gray-100">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem className="hover:bg-gray-700">
                <Link to={`/${username}`}>Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-gray-700">
                <Link to="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem onClick={handleLogout} className="hover:bg-gray-700">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <>
            <Button variant="outline" className="bg-gray-800 text-gray-100 hover:bg-gray-700 hover:text-white border-gray-700">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button className="bg-[#00BAFA] hover:bg-[#0095c8] text-white">
              <Link to="/signup">Sign Up</Link>
            </Button>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;