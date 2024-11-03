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
        const response = await fetch('http://snapstronaut.tech/api/login', {
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
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundColor: '#0B0E1D',
          backgroundImage: 'radial-gradient(circle, rgba(37, 78, 255, 0.1), transparent), url("/space.gif")',
          backgroundPosition: 'center',
          color: '#E0E7FF',
        }}
      >
        <div className="max-w-md w-full space-y-8 bg-slate-800  p-8 rounded-lg">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold" style={{ color: 'white' }}>
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
                  padding: '12px 16px',
                  marginBottom: '8px',
                  border: '1px solid #A3BFFA',
                  borderRadius: '4px',
                  backgroundColor: '#1F2937',
                  color: '#A3BFFA',
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
                  padding: '12px 16px',
                  marginBottom: '8px',
                  border: '1px solid #A3BFFA',
                  borderRadius: '4px',
                  backgroundColor: '#1F2937',
                  color: '#A3BFFA',
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
                Log in
              </button>
            </div>
          </form>
          <div style={{ textAlign: 'center' }}>
            <Link to="/signup" style={{ color: '#A3BFFA', textDecoration: 'none' }}>
              Don't have an account? Sign up
            </Link>
          </div>
        </div>
      </div>
    );
  }
