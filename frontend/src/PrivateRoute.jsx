// PrivateRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

const PrivateRoute = () => {
  const { user, loading } = useAuth();
  // console.log('PrivateRoute - User:', user, 'Loading:', loading); // Debug log

  if (loading) {
    return <div>Loading...</div>;
  }

  return user ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;
