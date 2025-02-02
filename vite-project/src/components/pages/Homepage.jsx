import React from 'react';
import { useNavigate } from 'react-router-dom';

const Homepage = () => {
    const fireGifUrl = "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExZnVtbmFhaGJncjk5M29jemlvYWlueGd4Y2d6ZXJudm1kNncwamxoNyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/lTkOQ1aacqClLCcBZq/giphy.gif";
    const navigate = useNavigate(); // Hook for navigation

    const handleButtonClick = () => {
        navigate('/location'); // Redirect to the /location route
    };

    return (
        <div
            className="fixed inset-0 w-full h-full"
            style={{
                backgroundImage: `url(${fireGifUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
            }}
        >
            {/* Centered Title */}
            <div className="font-bold absolute top-[10%] left-1/2 transform -translate-x-1/2 text-center w-full text-5xl">
                FireFight: In Honor of LA Fires 2025
            </div>

            {/* Centered Description */}
            <div className="absolute top-[25%] left-1/2 transform -translate-x-1/2 text-center w-full max-w-2xl px-4 text-2xl">
                This website uses your fireFight device and location to check the fire vulnerability of the area the sensor is in.
            </div>

            {/* Centered Button */}
            <button
                onClick={handleButtonClick}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full absolute top-[65%] left-1/2 transform -translate-x-1/2 z-10 rounded-full"
            >
                Check Fire Vulnerability
            </button>
        </div>
    );
};

export default Homepage;