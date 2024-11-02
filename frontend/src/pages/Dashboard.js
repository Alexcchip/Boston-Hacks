import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, logout } from '../utils/auth';

export default function Dashboard() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({ email: '', user_since: ''});

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/protected', {
          headers: {
            'Authorization': `Bearer ${getToken()}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        } else {
          handleLogout();
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        handleLogout();
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
      <nav style={{ 
        backgroundColor: 'white', 
        padding: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          maxWidth: '1280px', 
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Dashboard</h1>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              backgroundColor: '#DC2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      <main style={{ 
        maxWidth: '1280px', 
        margin: '0 auto',
        padding: '24px'
      }}>
        <div style={{ 
          border: '2px dashed #E5E7EB',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '8px' }}>
            Welcome!
          </h2>
          <p>User: {userData.email}</p>
          <p>Member since: {userData.user_since}</p>
        </div>
      </main>
    </div>
  );
}