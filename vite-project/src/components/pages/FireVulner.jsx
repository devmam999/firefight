import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const FireVulner = () => {
    const location = useLocation();
    const { coordinates } = location.state || {}; // Retrieve coordinates from state
    const [rainfallRisk, setRainfallRisk] = useState('');
    const [windRisk, setWindRisk] = useState('');
    const [temperatureRisk, setTemperatureRisk] = useState('');
    const [overallRisk, setOverallRisk] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (coordinates?.lat && coordinates?.lng) {
            fetchRiskData(coordinates.lat, coordinates.lng);
        }
    }, [coordinates]);

    const fetchRiskData = async (lat, lng) => {
        setLoading(true);
        setError('');

        try {
            const response = await axios.post('http://127.0.0.1:5000/api/coordinates', {
                lat,
                lng
            });

            const data = response.data;
            setRainfallRisk(data.fire_risk);
            setWindRisk(data.wind_risk);
            setTemperatureRisk(data.temperature_risk);

            // Calculate overall fire risk
            const overall = calculateOverallRisk(data.fire_risk, data.wind_risk, data.temperature_risk);
            setOverallRisk(overall);
        } catch (err) {
            setError('Failed to fetch data. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const calculateOverallRisk = (rainfallRisk, windRisk, temperatureRisk) => {
        // If any risk is "No Risk" or "Zero Risk," overall risk is "Zero Risk"
        if (
            rainfallRisk.toLowerCase() === 'no risk' ||
            windRisk.toLowerCase() === 'no risk' ||
            temperatureRisk.toLowerCase() === 'no risk'
        ) {
            return 'Zero Risk';
        }

        // Map risk levels to numerical values for averaging
        const riskLevels = {
            'low risk': 1,
            'moderate risk': 2,
            'high risk': 3,
            'extreme risk': 4,
        };

        // Get numerical values for each risk
        const rainfallValue = riskLevels[rainfallRisk.toLowerCase()] || 0;
        const windValue = riskLevels[windRisk.toLowerCase()] || 0;
        const temperatureValue = riskLevels[temperatureRisk.toLowerCase()] || 0;

        // Calculate average risk
        const average = (rainfallValue + windValue + temperatureValue) / 3;

        // Map the average back to a risk level
        if (average < 1.5) {
            return 'Low Risk';
        } else if (average < 2.5) {
            return 'Moderate Risk';
        } else if (average < 3.5) {
            return 'High Risk';
        } else {
            return 'Extreme Risk';
        }
    };

    const getRiskColor = (risk) => {
        switch (risk.toLowerCase()) {
            case 'low risk':
                return 'text-blue-500';
            case 'moderate risk':
                return 'text-yellow-500';
            case 'high risk':
                return 'text-red-500';
            case 'extreme risk':
                return 'text-red-800';
            case 'zero risk':
                return 'text-green-500';
            default:
                return 'text-gray-500';
        }
    };

    return (
        <div className="min-h-screen w-screen bg-gradient-to-b from-gray-800 to-gray-900 flex flex-col items-center justify-start p-6 text-white">
            <h1 className="text-4xl font-bold mt-10 mb-6">Fire, Wind, and Temperature Risk Assessment</h1>
            {error && <p className="text-red-500 text-lg mb-4">{error}</p>}
            {loading ? (
                <p className="text-lg">Loading...</p>
            ) : (
                <div className="bg-gray-800 shadow-lg rounded-lg p-8 w-full max-w-md">
                    {rainfallRisk && (
                        <h2 className={`text-2xl font-semibold mb-4 ${getRiskColor(rainfallRisk)}`}>
                            Rainfall Risk: {rainfallRisk}
                        </h2>
                    )}
                    {windRisk && (
                        <h2 className={`text-2xl font-semibold mb-4 ${getRiskColor(windRisk)}`}>
                            Wind Risk: {windRisk}
                        </h2>
                    )}
                    {temperatureRisk && (
                        <h2 className={`text-2xl font-semibold mb-4 ${getRiskColor(temperatureRisk)}`}>
                            Temperature Risk: {temperatureRisk}
                        </h2>
                    )}
                    {overallRisk && (
                        <h2 className={`text-2xl font-semibold mt-6 ${getRiskColor(overallRisk)}`}>
                            Overall Fire Risk: {overallRisk}
                        </h2>
                    )}
                </div>
            )}
        </div>
    );
};

export default FireVulner;