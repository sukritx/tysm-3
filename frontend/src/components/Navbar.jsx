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
import { Search, Instagram } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils"; // Make sure you have this utility function

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout, getToken } = useAuth();
  const [avatar, setAvatar] = useState(null);
  const [username, setUsername] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <header className="flex h-20 w-full shrink-0 items-center px-4 md:px-6 bg-gray-900">
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
              <div className="absolute right-0 mt-2 w-64">
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