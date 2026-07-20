import requests
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

API_KEY = os.getenv("OPENWEATHER_API_KEY")

def get_mumbai_aqi():
    url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat=19.0760&lon=72.8777&appid={API_KEY}"
    response = requests.get(url)
    data = response.json()
    
    aqi = data["list"][0]["main"]["aqi"]
    components = data["list"][0]["components"]
    
    labels = {1:"Good 🟢", 2:"Fair 🟡", 3:"Moderate 🟠", 4:"Poor 🔴", 5:"Very Poor 🟣"}
    
    print(f"\n{'='*40}")
    print(f"  AIR PROSECUTOR — Mumbai Live Data")
    print(f"  {datetime.now().strftime('%d %b %Y, %I:%M %p')}")
    print(f"{'='*40}")
    print(f"  AQI Level : {labels[aqi]}")
    print(f"  PM2.5     : {components['pm2_5']} µg/m³")
    print(f"  PM10      : {components['pm10']} µg/m³")
    print(f"  NO2       : {components['no2']} µg/m³")
    print(f"  CO        : {components['co']} µg/m³")
    print(f"  O3        : {components['o3']} µg/m³")
    print(f"{'='*40}\n")
    
    return components

def get_weather_context():
    url = f"http://api.openweathermap.org/data/2.5/weather?lat=19.0760&lon=72.8777&appid={API_KEY}&units=metric"
    response = requests.get(url)
    data = response.json()
    
    wind_speed = data["wind"]["speed"]
    wind_deg   = data["wind"]["deg"]
    humidity   = data["main"]["humidity"]
    temp       = data["main"]["temp"]
    
    # Wind direction label
    dirs = ["N","NE","E","SE","S","SW","W","NW"]
    wind_dir = dirs[round(wind_deg / 45) % 8]
    
    print(f"  🌡  Temp      : {temp}°C")
    print(f"  💨  Wind      : {wind_speed} m/s from {wind_dir}")
    print(f"  💧  Humidity  : {humidity}%")
    print(f"\n  ⚠️  Attribution hint:")
    
    if wind_speed < 2:
        print("  Low wind — pollutants are TRAPPED locally.")
        print("  Likely source: nearby construction or traffic.")
    elif wind_dir in ["W", "SW"]:
        print("  Wind from sea — industrial zones inland may be contributing.")
    else:
        print(f"  Wind from {wind_dir} — check emission sources in that direction.")
    
    print(f"{'='*40}\n")

if __name__ == "__main__":
    get_mumbai_aqi()
    get_weather_context()