import React, { useState } from 'react';

const FindLocationPage = () => {
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState({ lat: null, lng: null });
  const [weatherData, setWeatherData] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Handle manual location input
  const handleManualLocation = async (e) => {
    e.preventDefault();
    if (!location) {
      setError('Please enter a location.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`
      );
      const data = await response.json();

      if (data.length > 0) {
        const { lat, lon } = data[0];
        setCoordinates({ lat: parseFloat(lat), lng: parseFloat(lon) });
        setError('');
        await sendCoordinatesToBackend(parseFloat(lat), parseFloat(lon));
      } else {
        setError('Location not found.');
      }
    } catch (err) {
      setError('Failed to fetch location data.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle current location
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude });
        setError('');
        await sendCoordinatesToBackend(latitude, longitude);
      },
      (err) => {
        setError('Unable to retrieve your location.');
      }
    );
  };

  // Send coordinates to Python backend
  const sendCoordinatesToBackend = async (lat, lng) => {
    try {
      const response = await fetch('http://localhost:5000/api/coordinates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lat, lng }),
      });

      if (response.ok) {
        const data = await response.json();
        setWeatherData(data);
        setError('');
      } else {
        const errorData = await response.json();
        setError(`Backend error: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      setError('Failed to connect to the backend.');
      console.error('Error sending coordinates to backend:', err);
    }
  };

  return (
    <div className="bg-gray-700 min-h-screen min-w-screen flex justify-center items-center">
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl text-blue-700 font-bold text-center mb-6">Input Location</h1>

        <form onSubmit={handleManualLocation} className="mb-6">
          <label className="block text-sm font-medium text-blue-700 mb-2">
            Enter Location:
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., New York, NY"
            className="w-full px-4 py-2 border border-gray-300 text-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Convert to Coordinates'}
          </button>
        </form>

        <p className="text-center text-gray-600 mb-4">OR</p>

        <button
          onClick={handleCurrentLocation}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
        >
          Find Current Location
        </button>

        <p className="text-center text-gray-600 mb-4 mt-4 text-xs">
          If you use "Find Current Location", please stand as close as possible to the device for maximum accuracy.
        </p>

        {coordinates.lat && coordinates.lng && (
          <div className="mt-4 text-center">
            <h2 className="text-xl font-bold">Coordinates:</h2>
            <p className="text-gray-700">Latitude: {coordinates.lat}</p>
            <p className="text-gray-700">Longitude: {coordinates.lng}</p>
          </div>
        )}

        {weatherData && (
          <div className="mt-4 text-center">
            <h2 className="text-xl font-bold">Weather Data:</h2>
            <pre className="text-gray-700">{JSON.stringify(weatherData, null, 2)}</pre>
          </div>
        )}

        {error && <p className="mt-4 text-center text-red-500">{error}</p>}
      </div>
    </div>
  );
};

export default FindLocationPage;
