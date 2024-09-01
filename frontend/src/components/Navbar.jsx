import React from 'react';
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
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import tysmLogo from "../assets/tysm-logo.png";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout, getToken } = useAuth();
  const [avatar, setAvatar] = useState(null);
  const [username, setUsername] = useState('');

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

  const handleLogout = () => {
    logout();
    navigate('/login');
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
      <div className="ml-auto flex gap-2">
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