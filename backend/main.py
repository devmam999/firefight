import serial
import serial.tools.list_ports
from flask import Flask, request, jsonify
import requests
from flask_cors import CORS
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

try:
    ser = serial.Serial('COM11', baudrate=9600, timeout=1)
    print("Port opened successfully!")

    # Example: Write data to the port
    ser.write(b'Hello, device!')

    # Example: Read data from the port
    response = ser.readline()
    print(f"Response from device: {response}")

    ser.close()  # Always close the port when done
except serial.SerialException as e:
    print(f"Error: {e}")

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
        return "Moderate Risk"
    elif 14 <= days_without_rain < 60:
        return "High Risk"
    else:
        return "Extreme Risk"

# Function to classify wind speed risk
def classify_wind_speed(wind_speed):
    if wind_speed is None:
        return "Wind speed data not available"
    elif wind_speed < 10:
        return "Low Risk"
    elif 10 <= wind_speed <= 30:
        return "High Risk"
    else:
        return "Extreme Risk"

# Function to classify humidity risk
def classify_humidity(humidity):
    # Ensure humidity is a number, removing the '%' symbol if present
    # Remove the '%' symbol and convert to float
    
    # Now, perform the risk classification
    if humidity is None:
        return "Data not available"  # Handle None case
    if humidity > 80:
        return "No Risk"
    elif 35 <= humidity <= 80:
        return "Low Risk"
    elif 30 <= humidity < 35:
        return "Moderate Risk"  # Changed from "Risky"
    elif 20 < humidity < 30:
        return "High Risk"
    else:
        return "Extreme Risk"


# Function to classify temperature risk
def classify_temperature(temperature):
    if ((temperature*(9.0/5))+42) is None:
        return "Data not available"  # Handle None case
    if ((temperature*(9.0/5))+42) < 50:
        return "No Risk"
    elif 50 <= ((temperature*(9.0/5))+42) <= 75:
        return "Low Risk"
    elif 75 < ((temperature*(9.0/5))+42) <= 80:
        return "Moderate Risk"  # Changed from "Risky"
    elif 80 < ((temperature*(9.0/5))+42) <= 90:
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
        temperature = weather_data.get('current_weather', {}).get('temperature', None)
        humidity = weather_data.get('current_weather', {}).get('humidity', None)

        # Calculate fire risk based on rainfall data
        fire_risk = calculate_fire_risk(rainfall_data)

        # Classify wind, temperature, and humidity risks
        wind_risk = classify_wind_speed(wind_speed)
        humidity_risk = classify_humidity(humidity)
        temperature_risk = classify_temperature(temperature)

        # Return the fire risk, wind risk, humidity risk, temperature risk, and raw weather data
        return jsonify({
            'fire_risk': fire_risk,
            'wind_risk': wind_risk,
            'humidity_risk': humidity_risk,
            'temperature_risk': temperature_risk,
            'rainfall_data': rainfall_data,  # Optional: Include raw rainfall data
            'wind_speed': wind_speed,
            'temperature': temperature,
            'humidity': humidity,
            'start_date': start_date,
            'end_date': end_date
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/data', methods=['GET'])
def get_data():
    # Read the data from the Arduino serial output
    line = ser.readline().decode('utf-8').strip()
    print(f"Received line from Arduino: {line}")  # Debugging to see the exact data

    # Example line: "Low Risk Temp: 26.20 C, 69.16 F, Hum: 59.30%"
    try:
        # Split by commas to separate the parts of the string
        parts = line.split(',')

        # Extract the temperature part (C or F)
        temp_part = parts[1].strip()  # Temp: 26.20 C or 69.16 F
        humidity_part = parts[2].strip()  # Hum: 59.30%

        # Debugging: print parts to see what we're extracting
        print(f"Temperature part: {temp_part}")
        print(f"Humidity part: {humidity_part}")

        # Extract numerical values for temperature (in either C or F)
        temperature = float(temp_part.split()[1])  # Get temperature and convert to float

        # Extract the humidity part, remove '%', and convert to float
        humidity = float(humidity_part.split()[1].replace('%', '').strip())  # Get humidity and convert to float

        # Debugging: print final extracted values
        print(f"Extracted temperature: {temperature}, Extracted humidity: {humidity}")

        # Return the values as JSON
        return jsonify({'temperature': temperature, 'humidity': humidity})
    
    except Exception as e:
        return jsonify({'error': f"Error reading data: {str(e)}"}), 500




if __name__ == '__main__':
    app.run(debug=True)
