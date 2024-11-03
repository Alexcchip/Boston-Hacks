import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, logout } from '../utils/auth';

export default function Dashboard() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({ email: '', user_since: ''});
  const [recentTasks, setRecentTasks] = useState([]);
  const [notCompletedTasks, setNotCompletedTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [file, setFile] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState("");

  const fetchUserData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/protected', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
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

  const fetchRecentTasks = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/user-tasks/recent/5', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
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
        headers: { 'Authorization': `Bearer ${getToken()}` }
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

  const openModal = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedTask(null);
    setFile(null);
    setIsModalOpen(false);
    setMessage("");
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmitTaskCompletion = async () => {
    if (!file || !selectedTask) {
      setMessage("Please select a file.");
      return;
    }

    try {
      // Step 1: Request a pre-signed URL for file upload
      const presignedResponse = await fetch('http://localhost:5000/api/generate-presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ file_name: file.name })
      });
      const { url, file_key } = await presignedResponse.json();

      console.log("got presigned url")

      // Step 2: Upload the file to S3
      await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      });
      console.log("File uploaded to S3 successfully");

      // Step 3: Mark task as completed
      await fetch(`http://localhost:5000/api/tasks/${selectedTask.task_id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ file_key })
      });

      setMessage("Task completed successfully!");
      fetchNotCompletedTasks(); // Refresh not completed tasks
      fetchRecentTasks(); // Refresh recent tasks
      closeModal();
    } catch (error) {
      console.error("Error completing task:", error);
      setMessage("An error occurred while completing the task.");
    }
  };

  if (!userData) return <div>Loading...</div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ backgroundColor: 'white', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Dashboard</h1>
          <button onClick={handleLogout} style={{ padding: '8px 16px', backgroundColor: '#DC2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </nav>
  
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <section style={{ padding: '16px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2>Recently Completed Tasks</h2>
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
  
        <section style={{ padding: '16px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'auto', height:'450px', width:'500px'  }}>
          <h2>Tasks to Complete</h2>
          {notCompletedTasks.length > 0 ? (
            notCompletedTasks.map(task => (
              <div key={task.task_id} onClick={() => openModal(task)} style={{ padding: '8px 0', borderBottom: '1px solid #E5E7EB', cursor: 'pointer' }}>
                <p style={{ fontWeight: 'bold' }}>{task.task_name}</p>
                <p>Points: {task.points}</p>
              </div>
            ))
          ) : (
            <p>All tasks completed!</p>
          )}
        </section>
      </main>

      {isModalOpen && selectedTask && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', width: '400px' }}>
            <h3>{selectedTask.task_name}</h3>
            <p>{selectedTask.description}</p>
            <input type="file" onChange={handleFileChange} accept="image/*" />
            <button onClick={handleSubmitTaskCompletion} style={{ marginTop: '16px', padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Submit
            </button>
            <button onClick={closeModal} style={{ marginTop: '8px', padding: '8px 16px', backgroundColor: '#DC2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Cancel
            </button>
            {message && <p>{message}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
