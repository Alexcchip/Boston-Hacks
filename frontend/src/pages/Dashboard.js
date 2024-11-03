import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, logout } from '../utils/auth';

export default function Dashboard() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({ email: '', user_since: ''});

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

  const [recentTasks, setRecentTasks] = useState([]);
const [notCompletedTasks, setNotCompletedTasks] = useState([]);

const fetchRecentTasks = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/user-tasks/recent/5', {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
    if (response.ok) {
      const data = await response.json();
      setRecentTasks(data);
    } else {
      console.error('Error fetching recent tasks');
    }
  } catch (error) {
    console.error('Error fetching recent tasks:', error);
  }
};

const fetchNotCompletedTasks = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/tasks/not-completed', {
      headers: {
        'Authorization': `Bearer ${getToken()}`
      }
    });
    if (response.ok) {
      const data = await response.json();
      setNotCompletedTasks(data);
    } else {
      console.error('Error fetching not completed tasks');
    }
  } catch (error) {
    console.error('Error fetching not completed tasks:', error);
  }
};


useEffect(() => {
  fetchUserData();
  fetchRecentTasks();
  fetchNotCompletedTasks();
}, []);



  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6', display: 'flex', flexDirection: 'column' }}>
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
  
      {/* Add the main content with two sections */}
      <main style={{ 
        maxWidth: '1280px', 
        margin: '0 auto',
        padding: '24px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px'
      }}>
        {/* Recently Completed Tasks Section */}
        <section style={{ padding: '16px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '8px' }}>Recently Completed Tasks</h2>
          {recentTasks.length > 0 ? (
            recentTasks.map(task => (
              <div key={task.user_task_id} style={{ padding: '8px 0', borderBottom: '1px solid #E5E7EB' }}>
                <p style={{ fontWeight: 'bold' }}>{task.task_name}</p>
                <p>Completed at: {new Date(task.completed_at).toLocaleString()}</p>
                <img src={task.photo_url} alt="Completed task" style={{ maxWidth: '100%', marginTop: '8px' }} />
              </div>
            ))
          ) : (
            <p>No recent tasks completed.</p>
          )}
        </section>
  
        {/* Tasks to Complete Section */}
        <section style={{ padding: '16px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '8px' }}>Tasks to Complete</h2>
          {notCompletedTasks.length > 0 ? (
            notCompletedTasks.map(task => (
              <div key={task.task_id} style={{ padding: '8px 0', borderBottom: '1px solid #E5E7EB' }}>
                <p style={{ fontWeight: 'bold' }}>{task.task_name}</p>
                <p>{task.description}</p>
                <p>Points: {task.points}</p>
              </div>
            ))
          ) : (
            <p>All tasks completed!</p>
          )}
        </section>
      </main>
    </div>
  );
  
}