import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './PrivateRoute';
import AdminRoute from './AdminRoute';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Club from './pages/Club';
import Profile from './pages/ProfilePage';
import EditProfile from './pages/EditProfile';
import AddClub from './pages/AddClub';
import InviteCard from './pages/InviteCard';
import Messages from './pages/Messages';
import { Toaster } from 'react-hot-toast';
import Sales from './pages/Sales';
import AdminDashboard from './pages/AdminDashboard';
import AddCoin from './pages/AddCoin';

import ReactGA from 'react-ga4';

function App() {
  React.useEffect(() => {
    console.log('App mounted');
    // Remove all GA initialization code
  }, []);
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-900 text-white">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/invite/:inviteLink" element={<InviteCard />} />
            <Route element={<PrivateRoute />}>
              <Route path="/club/:id" element={<Club />} />
              <Route path="/:username" element={<Profile />} />
              <Route path="/edit-profile" element={<EditProfile />} />
              <Route path="/add-club" element={<AddClub />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/sales" element={<Sales />} />
            </Route>
            <Route element={<AdminRoute />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/add-coin" element={<AddCoin />} />
            </Route>
          </Routes>
          <Toaster position="top-right" />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;