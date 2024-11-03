import React, { useEffect, useState } from 'react';
import { getToken } from '../utils/auth';

export default function Leaderboard() {
  const [teamScores, setTeamScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTeamScores = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/teams/points', {
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

  if (loading) return <p className="text-center text-gray-500">Loading...</p>;
  if (error) return <p className="text-center text-red-500">Error: {error}</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Team Scores</h2>
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr>
            <th className="text-green">Team Name</th>
            <th className="px-4 py-2 border-b text-left text-gray-600 font-medium">Score</th>
          </tr>
        </thead>
        <tbody>
          {teamScores.map((team, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-4 py-2 border-b">{team.team_name}</td>
              <td className="px-4 py-2 border-b">{team.total_points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

