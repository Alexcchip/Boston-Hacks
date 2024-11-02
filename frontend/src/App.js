// App.js
import React from 'react';
import Feed from './components/Feed';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginForm from './components/auth/LoginForm';
import SignupForm from './components/auth/SignupForm';
import Dashboard from './pages/Dashboard';
import PrivateRoute from './components/PrivateRoute';


const posts = [
  {
    post_id: "1",
    caption: "Exploring the mountains! #adventure",
    posted_at: new Date("2023-10-12T08:30:00Z"),
    username: "john_doe",
    photo: "https://images.unsplash.com/photo-1541873676-a18131494184?q=80&w=1918&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    user_id: 101
  },
  {
    post_id: "2",
    caption: "Had an amazing time at the beach today. #sunnydays",
    posted_at: new Date("2023-10-13T14:45:00Z"),
    username: "jane_smith",
    photo: "photo2.jpg",
    user_id: 102
  },
  {
    post_id: "3",
    caption: "Just finished a new book. Highly recommend it! #bookworm",
    posted_at: new Date("2023-10-14T10:15:00Z"),
    username: "alex_92",
    photo: "photo3.jpg",
    user_id: 103
  }
  // Add more posts as needed
];

function App() {
  return (
    // <Feed posts= {posts}/>
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
        <Route path="/" element={<LoginForm />} />
      </Routes>
    </Router>
  )
}

export default App;
