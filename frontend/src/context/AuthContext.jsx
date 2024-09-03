import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      console.log('Initial token:', token);
      console.log('Initial stored user:', storedUser);

      if (token && storedUser) {
        try {
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/user/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log('User verification response:', response.data);
          
          if (response.data && response.data.user) {
            const userData = response.data.user;
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          } else {
            console.warn('User data not found in response. Using stored user data.');
            setUser(JSON.parse(storedUser));
          }
        } catch (error) {
          console.error('Error verifying token:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (username, password) => {
    try {
      console.log('Attempting login for:', username);
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/user/login`, {
        username,
        password
      });
      
      console.log('Login response:', response.data);

      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        console.log('Token stored:', response.data.token);

        // Fetch user data after successful login
        const userResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/user/me`, {
          headers: { Authorization: `Bearer ${response.data.token}` }
        });

        const userData = userResponse.data.user;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('User data stored:', userData);
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
    console.log('Logged out, token and user removed from storage');
  };

  const getToken = () => {
    const token = localStorage.getItem('token');
    console.log('Retrieved token:', token);
    return token;
  };

  // New function to update user data
  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    console.log('User data updated:', userData);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, getToken, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);