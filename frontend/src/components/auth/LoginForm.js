import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.access_token);
        navigate('/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred during login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Log in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div style={{ 
              backgroundColor: '#FEE2E2', 
              border: '1px solid #F87171',
              color: '#B91C1C',
              padding: '12px',
              borderRadius: '4px'
            }}>
              {error}
            </div>
          )}
          <div>
            <input
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <input
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              }}
            >
              Log in
            </button>
          </div>
        </form>
        <div style={{ textAlign: 'center' }}>
          <Link to="/signup" style={{ color: '#2563EB', textDecoration: 'none' }}>
            Don't have an account? Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}