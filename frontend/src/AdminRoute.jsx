import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

const AdminRoute = () => {
  const { user, checkAuth } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      await checkAuth();
      setIsChecking(false);
    };
    verifyAuth();
  }, [checkAuth]);

  if (isChecking) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  console.log('AdminRoute - Current user:', user);

  if (!user) {
    console.log('AdminRoute - No user, redirecting to login');
    return <Navigate to="/login" />;
  }

  if (!user.isAdmin) {
    console.log('AdminRoute - User is not admin, redirecting to home');
    return <Navigate to="/" />;
  }

  console.log('AdminRoute - User is admin, allowing access');
  return <Outlet />;
};

export default AdminRoute;