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

  const TaskCard = ({ task, onClick, isCompleted, username }) => (
    <div
      onClick={onClick}
      className={`p-4 transition-all duration-300 border rounded-lg cursor-pointer 
        bg-slate-700/50 border-slate-600 hover:border-blue-400 hover:transform hover:scale-105
        ${isCompleted ? 'hover:border-green-400' : 'hover:border-blue-400'}
        group relative overflow-hidden`}
    >
      <div className="absolute inset-0 transition-transform duration-1000 -translate-x-full bg-gradient-to-r from-transparent via-slate-400/5 to-transparent animate-shine group-hover:translate-x-full" />
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-white">{task.task_name}</h3>
          {username && <p className="text-sm text-slate-400">Posted by: {username}</p>}
        </div>
        {isCompleted ? (
          <Star className="w-5 h-5 text-yellow-400" />
        ) : (
          <Target className="w-5 h-5 text-blue-400" />
        )}
      </div>
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
          fetch('http://localhost:5000/api/protected', {
            headers: { 'Authorization': `Bearer ${getToken()}` }
          }),
          fetch('http://localhost:5000/api/user-tasks/recent/5', {
            headers: { 'Authorization': `Bearer ${getToken()}` }
          }),
          fetch('http://localhost:5000/api/tasks/not-completed', {
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
      const presignedResponse = await fetch('http://localhost:5000/api/generate-presigned-url', {
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
      await fetch(`http://localhost:5000/api/tasks/${selectedTask.task_id}/complete`, {
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
        fetch('http://localhost:5000/api/user-tasks/recent/5', {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        }).then(res => res.json()),
        fetch('http://localhost:5000/api/tasks/not-completed', {
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
                  <TaskCard key={task.user_task_id} task={task} isCompleted={true} username={task.username} />
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
                    username={task.username} // Add username here
                  />
                ))
              ) : (
                <p className="text-slate-400">All missions completed, great work!</p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal and other components remain the same */}
    </div>
  );
}