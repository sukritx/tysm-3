import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    console.log('Initial token:', token); // Debug log
    console.log('Initial stored user:', storedUser); // Debug log
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (username, password) => {
    try {
      console.log('Attempting login for:', username); // Debug log
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/user/login`, {
        username,
        password
      });
      
      console.log('Login response:', response.data); // Debug log

      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        console.log('Token stored:', response.data.token); // Debug log

        // Assuming the login response includes user data
        const userData = {
          username: username,
          // Add any other user data returned by your login endpoint
        };
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('User data stored:', userData); // Debug log
        setUser(userData);
        return true;
      } else {
        console.error('Login failed: No token in response');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error.response ? error.response.data : error.message);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    console.log('Logged out, token and user removed from storage'); // Debug log
  };

  const getToken = () => {
    const token = localStorage.getItem('token');
    console.log('Retrieved token:', token); // Debug log
    return token;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);