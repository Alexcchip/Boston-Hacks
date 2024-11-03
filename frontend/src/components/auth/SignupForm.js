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
      const response = await fetch('https://snapstronaut.tech/api/register', {
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
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{
        backgroundColor: '#0B0E1D',
        backgroundImage: 'radial-gradient(circle, rgba(37, 78, 255, 0.1), transparent), url("/space.gif")',
        backgroundPosition: 'center',
        color: '#E0E7FF',
      }}
    >
      <div className="max-w-md w-full space-y-8 bg-slate-800 p-8 rounded-lg">
        <div>
          <h2 className="text-center text-3xl font-extrabold" style={{ color: 'white' }}>
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
                padding: '12px 16px',
                marginBottom: '8px',
                border: '1px solid #A3BFFA',
                borderRadius: '4px',
                backgroundColor: '#1F2937',
                color: '#A3BFFA',
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
                padding: '12px 16px',
                marginBottom: '8px',
                border: '1px solid #A3BFFA',
                borderRadius: '4px',
                backgroundColor: '#1F2937',
                color: '#A3BFFA',
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
                padding: '12px 16px',
                marginBottom: '8px',
                border: '1px solid #A3BFFA',
                borderRadius: '4px',
                backgroundColor: '#1F2937',
                color: '#A3BFFA',
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
                padding: '12px 16px',
                marginBottom: '8px',
                border: '1px solid #A3BFFA',
                borderRadius: '4px',
                backgroundColor: '#1F2937',
                color: '#A3BFFA',
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
                padding: '12px 16px',
                backgroundColor: 'white',
                color: 'black',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'background-color 0.3s',
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = 'grey'}
              onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
            >
              Sign up
            </button>
          </div>
        </form>
        <div style={{ textAlign: 'center' }}>
          <Link to="/login" style={{ color: '#A3BFFA', textDecoration: 'none' }}>
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
