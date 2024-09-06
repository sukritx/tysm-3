import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './PrivateRoute';
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

function App() {
  return (
    <AuthProvider>
      <Router>
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
          </Routes>
          <Toaster position="top-right" />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;