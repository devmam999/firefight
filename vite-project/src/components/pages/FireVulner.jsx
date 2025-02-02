import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FireVulner = () => {
  const [temperature, setTemperature] = useState(null);
  const [humidity, setHumidity] = useState(null);
  const [error, setError] = useState(null);

  // Replace with your ESP32 IP address
  const ESP32_IP = 'http://<ESP32-IP>/data';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(ESP32_IP);
        setTemperature(response.data.temperature);
        setHumidity(response.data.humidity);
      } catch (error) {
        setError('Error fetching data');
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 5000); // Fetch data every 5 seconds

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div>
      <h1>DHT11 Sensor Data</h1>
      {error && <p>{error}</p>}
      {temperature !== null && humidity !== null ? (
        <div>
          <p>Temperature: {temperature}°C</p>
          <p>Humidity: {humidity}%</p>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default FireVulner;
