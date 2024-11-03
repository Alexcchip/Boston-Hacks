import React, { useState, useEffect } from 'react';

export default function Track() {
  const [issPosition, setIssPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchISSPosition = async () => {
    try {
      const response = await fetch('http://api.open-notify.org/iss-now.json');
      if (!response.ok) throw new Error('Failed to fetch ISS position');
      
      const data = await response.json();
      setIssPosition({
        latitude: parseFloat(data.iss_position.latitude),
        longitude: parseFloat(data.iss_position.longitude)
      });
      setLastUpdate(new Date(data.timestamp * 1000));
      setError('');
    } catch (err) {
      setError('Failed to fetch ISS position. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchISSPosition();
    const interval = setInterval(fetchISSPosition, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatCoordinate = (coord, type) => {
    const absolute = Math.abs(coord);
    const direction = type === 'lat' 
      ? (coord >= 0 ? 'N' : 'S')
      : (coord >= 0 ? 'E' : 'W');
    return `${absolute.toFixed(4)}° ${direction}`;
  };

  if (!issPosition && loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="text-blue-400 animate-pulse">
        Loading ISS coordinates...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Navigation Bar */}
      <nav className="border-b bg-slate-800/50 backdrop-blur-lg border-slate-700">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🛸</span>
              <h1 className="text-xl font-bold text-white">ISS Tracking Station</h1>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6">
          {error && (
            <div className="p-4 border border-red-700 rounded-lg bg-red-900/20">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* ISS Position Card */}
          <div className="overflow-hidden border bg-slate-800/50 backdrop-blur-lg border-slate-700 rounded-xl">
            <div className="p-6 border-b border-slate-700">
              <h2 className="flex items-center space-x-2 text-xl font-bold text-white">
                <span>🛰️</span>
                <span>Live ISS Position</span>
                {loading && (
                  <div className="w-2 h-2 ml-2 bg-blue-400 rounded-full animate-pulse"></div>
                )}
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Coordinates Grid */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="p-4 transition-colors border rounded-lg bg-slate-700/50 border-slate-600 hover:border-blue-400">
                  <h3 className="text-sm text-slate-300">Latitude</h3>
                  <p className="mt-1 text-2xl font-bold text-white">
                    {formatCoordinate(issPosition?.latitude, 'lat')}
                  </p>
                </div>
                <div className="p-4 transition-colors border rounded-lg bg-slate-700/50 border-slate-600 hover:border-blue-400">
                  <h3 className="text-sm text-slate-300">Longitude</h3>
                  <p className="mt-1 text-2xl font-bold text-white">
                    {formatCoordinate(issPosition?.longitude, 'lng')}
                  </p>
                </div>
              </div>

              {/* Status Bar */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                <span className="text-sm text-slate-300">
                  Last Update: {lastUpdate?.toLocaleTimeString()}
                </span>
                <span className="flex items-center space-x-2 text-sm text-slate-300">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Live Tracking</span>
                </span>
              </div>

              {/* Info Box */}
              <div className="p-4 transition-colors border rounded-lg bg-slate-700/20 border-slate-600">
                <p className="text-sm text-slate-300">
                  The International Space Station orbits at 28,000 km/h, completing a full orbit every 90 minutes. 
                  Position updates every 5 seconds.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}