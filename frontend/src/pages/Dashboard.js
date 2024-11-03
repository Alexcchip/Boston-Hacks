import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, logout } from '../utils/auth';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({ email: '', user_since: '' });
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

      console.log("got presigned url");

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

  if (!userData) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="text-blue-400 animate-pulse">
        Loading mission control...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <nav className="border-b bg-slate-800/50 backdrop-blur-lg border-slate-700">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <span className="text-2xl text-blue-400">🚀</span>
              <h1 className="text-xl font-bold text-white">Mission Control</h1>
            </div>
            <button 
              onClick={handleLogout} 
              className="flex items-center px-4 py-2 space-x-2 text-white transition-colors duration-200 bg-red-600 rounded-lg hover:bg-red-700"
            >
              <span>🚪</span>
              <span>Abort Mission</span>
            </button>
            <Link to="/track" style={{ color: '#A3BFFA', textDecoration: 'none' }}>
              See this
            </Link>
          </div>
        </div>
      </nav>

      <main className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Recent Tasks Section */}
          <div className="overflow-hidden border bg-slate-800/50 backdrop-blur-lg border-slate-700 rounded-xl">
            <div className="p-6 border-b border-slate-700">
              <h2 className="flex items-center space-x-2 text-xl font-bold text-white">
                <span>🛸</span>
                <span>Recent Space Missions</span>
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {recentTasks.length > 0 ? (
                recentTasks.map(task => (
                  <div 
                    key={task.user_task_id} 
                    className="p-4 transition-colors border rounded-lg bg-slate-700/50 border-slate-600 hover:border-blue-400"
                  >
                    <h3 className="font-bold text-white">{task.task_name}</h3>
                    <p className="text-sm text-slate-300">
                      Mission completed: {new Date(task.completed_at).toLocaleString()}
                    </p>
                    <img 
                      src={task.photo_url} 
                      alt="Mission complete" 
                      className="object-cover w-full mt-2 border rounded-lg border-slate-600"
                    />
                  </div>
                ))
              ) : (
                <p className="text-slate-400">No missions completed yet, astronaut!</p>
              )}
            </div>
          </div>

          {/* Tasks to Complete Section */}
          <div className="overflow-hidden border bg-slate-800/50 backdrop-blur-lg border-slate-700 rounded-xl">
            <div className="p-6 border-b border-slate-700">
              <h2 className="flex items-center space-x-2 text-xl font-bold text-white">
                <span>🎯</span>
                <span>Pending Missions</span>
              </h2>
            </div>
            <div className="p-6 space-y-4 h-[450px] overflow-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
              {notCompletedTasks.length > 0 ? (
                notCompletedTasks.map(task => (
                  <div
                    key={task.task_id}
                    onClick={() => openModal(task)}
                    className="p-4 transition-colors border rounded-lg cursor-pointer bg-slate-700/50 border-slate-600 hover:border-blue-400"
                  >
                    <h3 className="font-bold text-white">{task.task_name}</h3>
                    <p className="text-blue-400">Mission Points: {task.points}</p>
                  </div>
                ))
              ) : (
                <p className="text-slate-400">All missions completed, great work!</p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal */}
      {isModalOpen && selectedTask && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-[400px] overflow-hidden">
            <div className="p-6 border-b border-slate-700">
              <h3 className="text-xl font-bold text-white">{selectedTask.task_name}</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-slate-300">{selectedTask.description}</p>
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex items-center justify-center p-4 space-x-2 transition-colors border-2 border-dashed rounded-lg cursor-pointer border-slate-600 hover:border-blue-400 text-slate-300"
                  >
                    <span>📤</span>
                    <span>Upload mission evidence</span>
                  </label>
                </div>
                {file && (
                  <p className="text-sm text-slate-400">Selected: {file.name}</p>
                )}
                {message && (
                  <p className="text-sm text-blue-400">{message}</p>
                )}
                <div className="flex space-x-3">
                  <button 
                    onClick={handleSubmitTaskCompletion}
                    className="flex-1 px-4 py-2 text-white transition-colors duration-200 bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Complete Mission
                  </button>
                  <button 
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 text-white transition-colors duration-200 bg-red-600 rounded-lg hover:bg-red-700"
                  >
                    Abort
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
