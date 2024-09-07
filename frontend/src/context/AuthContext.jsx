import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
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
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/user/login`, {
        username,
        password
      });

      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);

        const userResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/user/me`, {
          headers: { Authorization: `Bearer ${response.data.token}` }
        });

        const userData = userResponse.data.user;
        const userDataWithAdmin = {
          ...userData,
          isAdmin: userData.isAdmin || false
        };

        setUser(userDataWithAdmin);
        localStorage.setItem('user', JSON.stringify(userDataWithAdmin));
        console.log('User data stored:', userDataWithAdmin);

        // Redirect based on user role
        if (userDataWithAdmin.isAdmin) {
          console.log('Admin user logged in, redirecting to admin dashboard');
          navigate('/admin/dashboard');
        } else {
          console.log('Regular user logged in, redirecting to home');
          navigate('/');
        }

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

  const getToken = useCallback(() => {
    const token = localStorage.getItem('token');
    console.log('Retrieved token:', token);
    return token;
  }, []);

  // New function to update user data
  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    console.log('User data updated:', userData);
  };

  const checkAuth = useCallback(async () => {
    const token = getToken();
    if (token && !user) {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/user/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const userData = response.data.user;
        setUser({
          ...userData,
          isAdmin: userData.isAdmin || false
        });
        return true;
      } catch (error) {
        console.error('Error checking auth:', error);
        logout();
        return false;
      }
    }
    return !!user;
  }, [getToken, user]);

  return (
    <AuthContext.Provider value={{ user, login, logout, getToken, updateUser, checkAuth, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);