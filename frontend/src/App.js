// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginForm from './components/auth/LoginForm';
import SignupForm from './components/auth/SignupForm';
import Dashboard from './pages/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import Leaderboard from './pages/Leaderboard'
import Track from './pages/Track';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/signup" element={<SignupForm />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/track"
          element={
            <PrivateRoute>
              <Track />
            </PrivateRoute>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <PrivateRoute>
              <Leaderboard />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<LoginForm />} />
      </Routes>
    </Router>
  )
}

export default App;
