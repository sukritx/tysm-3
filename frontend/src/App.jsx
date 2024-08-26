// App.jsx
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

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-900 text-white">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route element={<PrivateRoute />}>
              <Route path="/club/:id" element={<Club />} />
              <Route path="/profile/:username" element={<Profile />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;