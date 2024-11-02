import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function SignupForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    team_name: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        navigate('/login');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('An error occurred during registration');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 style={{ 
            textAlign: 'center', 
            fontSize: '1.875rem',
            fontWeight: 'bold',
            marginBottom: '24px'
          }}>
            Create your account
          </h2>
        </div>
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ 
              backgroundColor: '#FEE2E2', 
              border: '1px solid #F87171',
              color: '#B91C1C',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}
          <div>
            <input
              name="username"
              type="text"
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                marginBottom: '8px',
                border: '1px solid #D1D5DB',
                borderRadius: '4px',
              }}
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
            />
          </div>
          <div>
            <input
              name="email"
              type="email"
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                marginBottom: '8px',
                border: '1px solid #D1D5DB',
                borderRadius: '4px',
              }}
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div>
            <input
              name="password"
              type="password"
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                marginBottom: '8px',
                border: '1px solid #D1D5DB',
                borderRadius: '4px',
              }}
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          <div>
            <input
              name="team_name"
              type="text"
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                marginBottom: '8px',
                border: '1px solid #D1D5DB',
                borderRadius: '4px',
              }}
              placeholder="Team Name"
              value={formData.team_name}
              onChange={handleChange}
            />
          </div>
          <div>
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '8px 16px',
                backgroundColor: '#2563EB',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginBottom: '16px'
              }}
            >
              Sign up
            </button>
          </div>
        </form>
        <div style={{ textAlign: 'center' }}>
          <Link to="/login" style={{ color: '#2563EB', textDecoration: 'none' }}>
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

// src/utils/auth.js
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

export const getToken = () => {
  return localStorage.getItem('token');
};

export const logout = () => {
  localStorage.removeItem('token');
};