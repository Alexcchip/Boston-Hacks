import React, { useEffect, useState } from 'react';
import { getToken } from '../utils/auth';
import { Trophy, Star, Rocket } from 'lucide-react';

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

const LoadingAnimation = () => (
  <div className="flex flex-col items-center justify-center min-h-screen">
    <Rocket className="w-12 h-12 mb-4 text-blue-400 animate-bounce" />
    <div className="text-blue-400 animate-pulse">
      Loading mission data...
    </div>
  </div>
);

export default function Leaderboard() {
  const [teamScores, setTeamScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTeamScores = async () => {
    try {
      const response = await fetch('http://snapstronaut.tech/api/teams/points', {
        headers: { 'Authorization': `Bearer ${getToken()}` },
      });
      if (!response.ok) throw new Error('Failed to fetch team scores');
      const data = await response.json();
      setTeamScores(data.sort((a, b) => b.total_points - a.total_points));
    } catch (err) {
      console.error('Error fetching team scores:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamScores();
  }, []);

  if (loading) return <LoadingAnimation />;
  if (error) return (
    <div className="flex items-center justify-center min-h-screen text-red-400">
      Mission Error: {error}
    </div>
  );

  const maxPoints = Math.max(...teamScores.map(team => team.total_points));

  const getRankEmoji = (index) => {
    switch(index) {
      case 0: return <Trophy className="w-6 h-6 text-yellow-400" />;
      case 1: return <Trophy className="w-6 h-6 text-slate-300" />;
      case 2: return <Trophy className="w-6 h-6 text-amber-600" />;
      default: return <Star className="w-6 h-6 text-blue-400" />;
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <StarField />
      
      <div className="relative z-10 px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="overflow-hidden border bg-slate-800/50 backdrop-blur-lg border-slate-700 rounded-xl">
          <div className="p-6 border-b border-slate-700">
            <h2 className="flex items-center space-x-2 text-xl font-bold text-white">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <span>Galactic Leaderboard</span>
            </h2>
          </div>
          
          <div className="p-6 space-y-6">
            {teamScores.map((team, index) => (
              <div 
                key={index}
                className="relative group"
              >
                <div className="flex items-center mb-2">
                  <div className="flex items-center w-48 space-x-3">
                    {getRankEmoji(index)}
                    <span className="text-lg font-medium text-white">
                      {team.team_name}
                    </span>
                  </div>
                  <div className="ml-4 text-lg font-semibold text-blue-400">
                    {team.total_points} pts
                  </div>
                </div>
                
                {/* Animated Progress Bar */}
                <div className="relative h-8 overflow-hidden rounded-lg bg-slate-700/50">
                  <div 
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-400 opacity-20"
                    style={{
                      width: `${(team.total_points / maxPoints) * 100}%`,
                      transition: 'width 1s ease-out'
                    }}
                  />
                  <div 
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-400"
                    style={{
                      width: `${(team.total_points / maxPoints) * 100}%`,
                      animation: 'slideRight 1s ease-out'
                    }}
                  >
                    <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  </div>
                </div>

                {/* Hover Effect - Constellation Lines */}
                <div className="absolute inset-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-transparent" />
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-1 bg-blue-400 rounded-full animate-twinkle"
                      style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 2}s`
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Particles */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-blue-400/30 animate-float"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 10 + 5}s`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>
    </div>
  );
}