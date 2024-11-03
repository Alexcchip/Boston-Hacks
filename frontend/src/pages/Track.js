import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const issIcon = new L.Icon({
  iconUrl: './iss.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

function MapEvents({ onMapClick }) {
  const map = useMap();
  
  useEffect(() => {
    map.on('click', onMapClick);
    return () => {
      map.off('click', onMapClick);
    };
  }, [map, onMapClick]);

  return null;
}

export default function Track() {
  const [issPosition, setIssPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationInfo, setLocationInfo] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const fetchISSPosition = async () => {
    try {
      const response = await fetch('https://api.open-notify.org/iss-now.json');
      if (!response.ok) throw new Error('Failed to fetch ISS position');
      
      const data = await response.json();
      const newPosition = {
        latitude: parseFloat(data.iss_position.latitude),
        longitude: parseFloat(data.iss_position.longitude)
      };
      setIssPosition(newPosition);
      setLastUpdate(new Date(data.timestamp * 1000));
      
      // Fetch location name for ISS position
      fetchLocationInfo(newPosition.latitude, newPosition.longitude, true);
      setError('');
    } catch (err) {
      setError('Failed to fetch ISS position. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLocationInfo = async (lat, lng, isISS = false) => {
    setLoadingLocation(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`
      );
      if (!response.ok) throw new Error('Failed to fetch location information');
      
      const data = await response.json();
      const locationData = {
        city: data.address.city || data.address.town || data.address.county || 'Over Ocean',
        state: data.address.state || data.address.region || '',
        country: data.address.country || 'International Waters',
        description: isISS ? 'ISS is currently over' : 'Selected location'
      };
      
      if (!isISS) {
        setLocationInfo(locationData);
      } else {
        setIssPosition(prev => ({
          ...prev,
          location: locationData
        }));
      }
    } catch (err) {
      if (!isISS) {
        setLocationInfo({
          city: 'Ocean or Remote Area',
          country: 'International Waters',
          description: 'Selected location'
        });
      }
    } finally {
      setLoadingLocation(false);
    }
  };

  useEffect(() => {
    fetchISSPosition();
    const interval = setInterval(fetchISSPosition, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatCoordinate = (coord, type) => {
    if (coord === undefined || coord === null) return 'N/A';
    const absolute = Math.abs(coord);
    const direction = type === 'lat' 
      ? (coord >= 0 ? 'N' : 'S')
      : (coord >= 0 ? 'E' : 'W');
    return `${absolute.toFixed(4)}° ${direction}`;
  };

  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    setSelectedLocation({ lat, lng });
    fetchLocationInfo(lat, lng);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0f1729]">
      <div className="text-blue-400 animate-pulse">Loading ISS coordinates...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f1729]">
      <nav className="border-b bg-[#1a2337]/50 backdrop-blur-lg border-[#2a3854]">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🛸</span>
              <h1 className="text-xl font-bold text-white">ISS Tracking Station</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="space-y-6">
          {error && (
            <div className="p-4 border rounded-lg border-red-700/50 bg-red-900/20">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          <div className="overflow-hidden border rounded-xl bg-[#1a2337]/50 backdrop-blur-lg border-[#2a3854]">
            <div className="p-6 border-b border-[#2a3854]">
              <h2 className="flex items-center space-x-2 text-xl font-bold text-white">
                <span>🗺️</span>
                <span>World Map Tracker</span>
              </h2>
            </div>
            <div className="p-6">
              <div className="h-[500px] border rounded-lg border-[#2a3854] overflow-hidden">
                <MapContainer
                  center={[0, 0]}
                  zoom={2}
                  style={{ height: '100%', width: '100%' }}
                  className="z-0"
                  minZoom={2}
                  maxBounds={[[-90, -180], [90, 180]]}
                  maxBoundsViscosity={1.0}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapEvents onMapClick={handleMapClick} />
                  
                  {issPosition && (
                    <Marker
                      position={[issPosition.latitude, issPosition.longitude]}
                      icon={issIcon}
                    >
                      <Popup>
                        <div className="text-center">
                          <strong>ISS Current Location</strong><br />
                          <strong>{issPosition.location?.city}</strong><br />
                          {issPosition.location?.state && `${issPosition.location.state}, `}
                          {issPosition.location?.country}<br />
                          Lat: {formatCoordinate(issPosition.latitude, 'lat')}<br />
                          Lng: {formatCoordinate(issPosition.longitude, 'lng')}
                        </div>
                      </Popup>
                    </Marker>
                  )}
                  
                  {selectedLocation && (
                    <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
                      <Popup>
                        <div className="text-center">
                          <strong>Selected Location</strong><br />
                          {loadingLocation ? (
                            <span>Loading location info...</span>
                          ) : locationInfo && (
                            <>
                              <strong>{locationInfo.city}</strong><br />
                              {locationInfo.state && `${locationInfo.state}, `}
                              {locationInfo.country}
                            </>
                          )}<br />
                          Lat: {formatCoordinate(selectedLocation.lat, 'lat')}<br />
                          Lng: {formatCoordinate(selectedLocation.lng, 'lng')}
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
              <div className="mt-4 text-sm text-gray-400">
                Click anywhere on the map to see location details. The ISS marker updates automatically while the map stays fixed.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="overflow-hidden border rounded-xl bg-[#1a2337]/50 backdrop-blur-lg border-[#2a3854]">
              <div className="p-6 border-b border-[#2a3854]">
                <h2 className="flex items-center space-x-2 text-xl font-bold text-white">
                  <span>🛰️</span>
                  <span>ISS Position</span>
                </h2>
              </div>
              <div className="p-6">
                <div className="grid gap-4">
                  {issPosition?.location && (
                    <div className="p-4 border rounded-lg bg-[#1a2337]/50 border-[#2a3854]">
                      <div className="text-sm text-gray-400">Current Location</div>
                      <div className="mt-1 text-xl font-bold text-white">
                        {issPosition.location.city}
                      </div>
                      <div className="mt-1 text-sm text-gray-400">
                        {issPosition.location.state && `${issPosition.location.state}, `}
                        {issPosition.location.country}
                      </div>
                    </div>
                  )}
                  <div className="p-4 border rounded-lg bg-[#1a2337]/50 border-[#2a3854]">
                    <div className="text-sm text-gray-400">Latitude</div>
                    <div className="mt-1 text-xl font-bold text-white">
                      {formatCoordinate(issPosition?.latitude, 'lat')}
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg bg-[#1a2337]/50 border-[#2a3854]">
                    <div className="text-sm text-gray-400">Longitude</div>
                    <div className="mt-1 text-xl font-bold text-white">
                      {formatCoordinate(issPosition?.longitude, 'lng')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {selectedLocation && (
              <div className="overflow-hidden border rounded-xl bg-[#1a2337]/50 backdrop-blur-lg border-[#2a3854]">
                <div className="p-6 border-b border-[#2a3854]">
                  <h2 className="flex items-center space-x-2 text-xl font-bold text-white">
                    <span>📍</span>
                    <span>Selected Location</span>
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid gap-4">
                    {locationInfo && (
                      <div className="p-4 border rounded-lg bg-[#1a2337]/50 border-[#2a3854]">
                        <div className="text-sm text-gray-400">Location</div>
                        <div className="mt-1 text-xl font-bold text-white">
                          {locationInfo.city}
                        </div>
                        <div className="mt-1 text-sm text-gray-400">
                          {locationInfo.state && `${locationInfo.state}, `}
                          {locationInfo.country}
                        </div>
                      </div>
                    )}
                    <div className="p-4 border rounded-lg bg-[#1a2337]/50 border-[#2a3854]">
                      <div className="text-sm text-gray-400">Latitude</div>
                      <div className="mt-1 text-xl font-bold text-white">
                        {formatCoordinate(selectedLocation.lat, 'lat')}
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg bg-[#1a2337]/50 border-[#2a3854]">
                      <div className="text-sm text-gray-400">Longitude</div>
                      <div className="mt-1 text-xl font-bold text-white">
                        {formatCoordinate(selectedLocation.lng, 'lng')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border rounded-lg bg-[#1a2337]/50 border-[#2a3854]">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>Last Update: {lastUpdate?.toLocaleTimeString()}</span>
              <span className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Live Tracking</span>
              </span>
            </div>
          </div>
              <div className="overflow-hidden border rounded-xl bg-[#1a2337]/50 backdrop-blur-lg border-[#2a3854]">
      <div className="p-6 border-b border-[#2a3854]">
        <h2 className="flex items-center space-x-2 text-xl font-bold text-white">
          <span>🔭</span>
          <span>When will you be flying over your family?</span>
        </h2>
      </div>
      <div className="p-6">
        <div className="flex justify-center">
          <div className="inline-block overflow-hidden border rounded-lg border-[#2a3854] bg-[#1a2337]/50">
            <iframe
              src="https://spotthestation.nasa.gov/widget/widget2.cfm?theme=2"
              className="w-[310px] h-[450px]"
              title="NASA Spot The Station Widget"
            />
          </div>
        </div>
        <div className="mt-4 text-sm text-center text-gray-400">
          View when you will be flying over your loved ones by entering a desired location.
        </div>
      </div>
    </div>


        </div>
      </main>
    </div>
  );
}