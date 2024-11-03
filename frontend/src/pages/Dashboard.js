import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, logout } from '../utils/auth';
import { Link } from 'react-router-dom';
import { Rocket, LogOut, Upload, Star, Target, Clock } from 'lucide-react';

const StarField = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            opacity: Math.random() * 0.7 + 0.3
          }}
        />
      ))}
    </div>
  );
};

const RocketLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900">
    <Rocket className="w-12 h-12 mb-4 text-blue-400 animate-bounce" />
    <div className="text-blue-400 animate-pulse">
      Initiating Mission Control...
    </div>
  </div>
);

const TaskCard = ({ task, onClick, isCompleted, postedBy }) => (
  <div
    onClick={onClick}
    className={`p-4 transition-all duration-300 border rounded-lg cursor-pointer 
      bg-slate-700/50 border-slate-600 hover:border-blue-400 hover:transform hover:scale-105
      ${isCompleted ? 'hover:border-green-400' : 'hover:border-blue-400'}
      group relative overflow-hidden`}
  >
    <div className="absolute inset-0 transition-transform duration-1000 -translate-x-full bg-gradient-to-r from-transparent via-slate-400/5 to-transparent animate-shine group-hover:translate-x-full" />
    <div className="flex items-start justify-between">
      <h3 className="font-bold text-white">{task.task_name}</h3>
      {isCompleted ? (
        <Star className="w-5 h-5 text-yellow-400" />
      ) : (
        <Target className="w-5 h-5 text-blue-400" />
      )}
    </div>
    <p className="mt-1 text-sm text-slate-400">Posted by: {postedBy}</p>
    {isCompleted ? (
      <>
        <p className="mt-2 text-sm text-slate-300">
          <Clock className="inline w-4 h-4 mr-1" />
          {new Date(task.completed_at).toLocaleString()}
        </p>
        {task.photo_url && (
          <img 
            src={task.photo_url} 
            alt="Mission complete" 
            className="object-cover w-full mt-2 transition-transform duration-300 border rounded-lg border-slate-600 hover:scale-105"
          />
        )}
      </>
    ) : (
      <p className="mt-2 text-blue-400">Mission Points: {task.points}</p>
    )}
  </div>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [notCompletedTasks, setNotCompletedTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [file, setFile] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Combine all data fetching in a single useEffect
  useEffect(() => {
    const loadData = async () => {
      try {
        const [userResponse, recentResponse, notCompletedResponse] = await Promise.all([
          fetch('http://snapstronaut.tech/api/protected', {
            headers: { 'Authorization': `Bearer ${getToken()}` }
          }),
          fetch('http://snapstronaut.tech/api/user-tasks/recent/5', {
            headers: { 'Authorization': `Bearer ${getToken()}` }
          }),
          fetch('http://snapstronaut.tech/api/tasks/not-completed', {
            headers: { 'Authorization': `Bearer ${getToken()}` }
          })
        ]);

        if (!userResponse.ok) {
          handleLogout();
          return;
        }

        const [userData, recentData, notCompletedData] = await Promise.all([
          userResponse.json(),
          recentResponse.json(),
          notCompletedResponse.json()
        ]);

        setUserData(userData);
        setRecentTasks(recentData);
        setNotCompletedTasks(notCompletedData);
        
        // Add slight delay for loading animation
        setTimeout(() => setIsLoading(false), 1500);
      } catch (error) {
        console.error('Error loading data:', error);
        handleLogout();
      }
    };

    loadData();
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
      const presignedResponse = await fetch('http://snapstronaut.tech/api/generate-presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ file_name: file.name })
      });
      const { url, file_key } = await presignedResponse.json();

      // Step 2: Upload the file to S3
      await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      });

      // Step 3: Mark task as completed
      await fetch(`http://snapstronaut.tech/api/tasks/${selectedTask.task_id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ file_key })
      });

      setMessage("Task completed successfully!");
      
      // Refresh data after completion
      const [recentData, notCompletedData] = await Promise.all([
        fetch('http://snapstronaut.tech/api/user-tasks/recent/5', {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        }).then(res => res.json()),
        fetch('http://snapstronaut.tech/api/tasks/not-completed', {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        }).then(res => res.json())
      ]);

      setRecentTasks(recentData);
      setNotCompletedTasks(notCompletedData);
      closeModal();
    } catch (error) {
      console.error("Error completing task:", error);
      setMessage("An error occurred while completing the task.");
    }
  };

  if (isLoading) {
    return <RocketLoader />;
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <StarField />
      
      {/* Rest of the component remains the same... */}
      <nav className="sticky top-0 z-10 border-b bg-slate-800/80 backdrop-blur-lg border-slate-700">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Rocket className="w-8 h-8 text-blue-400 animate-pulse" />
              <h1 className="text-xl font-bold text-white">Mission Control</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                to="/leaderboard" 
                className="text-indigo-300 transition-colors duration-200 hover:text-indigo-200"
              >
                Leaderboard
              </Link>
              <Link 
                to="/track" 
                className="text-indigo-300 transition-colors duration-200 hover:text-indigo-200"
              >
                Planetary Tracker
              </Link>
              <button 
                onClick={handleLogout} 
                className="flex items-center px-4 py-2 space-x-2 text-white transition-all duration-200 bg-red-600 rounded-lg hover:bg-red-700 hover:scale-105"
              >
                <LogOut className="w-4 h-4" />
                <span>Abort Mission</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative px-4 py-8 mx-auto z-1 max-w-7xl sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Recent Tasks Section */}
          <div className="overflow-hidden border bg-slate-800/50 backdrop-blur-lg border-slate-700 rounded-xl">
            <div className="p-6 border-b border-slate-700">
              <h2 className="flex items-center space-x-2 text-xl font-bold text-white">
                <Star className="w-6 h-6 text-yellow-400" />
                <span>Completed Missions</span>
              </h2>
            </div>
            <div className="p-6 space-y-4 h-[400px] overflow-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
              {recentTasks.length > 0 ? (
                recentTasks.map(task => (
                  <TaskCard key={task.user_task_id} task={task} isCompleted={true} postedBy={task.username || 'Unknown'}/>
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
                <Target className="w-6 h-6 text-blue-400" />
                <span>Pending Missions</span>
              </h2>
            </div>
            <div className="p-6 space-y-4 h-[400px] overflow-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
              {notCompletedTasks.length > 0 ? (
                notCompletedTasks.map(task => (
                  <TaskCard 
                    key={task.task_id} 
                    task={task} 
                    onClick={() => openModal(task)} 
                    isCompleted={false}
                  />
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
        <div 
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-[400px] overflow-hidden animate-modal-appear">
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
                    className="flex items-center justify-center p-4 space-x-2 transition-all duration-300 border-2 border-dashed rounded-lg cursor-pointer border-slate-600 hover:border-blue-400 hover:scale-105 text-slate-300"
                  >
                    <Upload className="w-5 h-5" />
                    <span>Upload mission evidence</span>
                  </label>
                </div>
                {file && (
                  <p className="text-sm text-slate-400 animate-fade-in">Selected: {file.name}</p>
                )}
                {message && (
                  <p className="text-sm text-blue-400 animate-fade-in">{message}</p>
                )}
                <div className="flex space-x-3">
                  <button 
                    onClick={handleSubmitTaskCompletion}
                    className="flex-1 px-4 py-2 text-white transition-all duration-200 bg-blue-600 rounded-lg hover:bg-blue-700 hover:scale-105"
                  >
                    Complete Mission
                  </button>
                  <button 
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 text-white transition-all duration-200 bg-red-600 rounded-lg hover:bg-red-700 hover:scale-105"
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