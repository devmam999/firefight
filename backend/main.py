from flask import Flask, request, jsonify
import requests
from flask_cors import CORS
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# Function to calculate fire risk based on rainfall data
def calculate_fire_risk(rainfall_data):
    days_without_rain = 0  # Count of consecutive days without significant rain
    threshold = 2.5  # Threshold for significant rainfall (in mm)

    for daily_rainfall in rainfall_data:
        if daily_rainfall < threshold:
            days_without_rain += 1
        else:
            days_without_rain = 0  # Reset counter if significant rain occurs

    # Classify fire risk based on days without significant rainfall
    if days_without_rain < 7:
        return "Low Risk"
    elif 7 <= days_without_rain < 14:
        return "Risky"
    elif 14 <= days_without_rain < 60:
        return "High Risk"
    else:
        return "Extreme Risk"

# Function to classify wind speed risk
def classify_wind_speed(wind_speed):
    if wind_speed is None:
        return "Wind speed data not available"
    elif wind_speed < 10:
        return "Light Risk"
    elif 10 <= wind_speed <= 30:
        return "High Risk"
    else:
        return "Extreme Risk"

@app.route('/api/coordinates', methods=['POST'])
def handle_coordinates():
    # Get coordinates from the request
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    lat = data.get('lat')
    lng = data.get('lng')

    if not lat or not lng:
        return jsonify({'error': 'Invalid coordinates'}), 400

    # Dynamically calculate start and end dates for the last 2 months
    end_date = datetime.today().strftime('%Y-%m-%d')  # Today's date
    start_date = (datetime.today() - timedelta(days=60)).strftime('%Y-%m-%d')  # 60 days ago

    # Fetch weather data from Open-Meteo API
    try:
        response = requests.get(
            f'https://archive-api.open-meteo.com/v1/archive?latitude={lat}&longitude={lng}&start_date={start_date}&end_date={end_date}&daily=rain_sum'
        )
        weather_data = response.json()

        # Extract daily rainfall data
        rainfall_data = weather_data.get('daily', {}).get('rain_sum', [])
        if not rainfall_data:
            return jsonify({'error': 'No rainfall data available'}), 500
        
        # Replace None values with 0.0 in rainfall_data
        rainfall_data = [0.0 if rain is None else rain for rain in rainfall_data]

        # Fetch current weather data (including wind speed) from Open-Meteo
        weather_response = requests.get(
            f'https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&current_weather=true')
        weather_data = weather_response.json()
        wind_speed = weather_data.get('current_weather', {}).get('windspeed', None)

        # Calculate fire risk based on rainfall data
        fire_risk = calculate_fire_risk(rainfall_data)

        # Classify wind risk
        wind_risk = classify_wind_speed(wind_speed)

        # Return the fire risk, wind risk, and raw weather data
        return jsonify({
            'fire_risk': fire_risk,
            'wind_risk': wind_risk,
            'rainfall_data': rainfall_data,  # Optional: Include raw rainfall data
            'wind_speed': wind_speed,
            'start_date': start_date,
            'end_date': end_date
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
if __name__ == '__main__':
    app.run(debug=True)