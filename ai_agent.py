import os
import json
from dotenv import load_dotenv
from datetime import datetime
from groq import Groq

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def _rule_based_analysis(city, aqi_data, weather_data, attribution, error, lang="Hindi"):
    aqi      = aqi_data["level"]
    wind_dir = weather_data["wind_direction"]
    wind_spd = weather_data["wind_speed"]
    sources  = attribution["sources"]
    risk_map = {1:"LOW",2:"LOW",3:"MEDIUM",4:"HIGH",5:"CRITICAL"}
    health_map = {
        1:"Air quality is good. Safe for all groups including children and elderly.",
        2:"Acceptable. Unusually sensitive individuals may experience minor symptoms.",
        3:"Children, elderly, and those with respiratory conditions should limit outdoor activity.",
        4:"Everyone may experience health effects. Sensitive groups should avoid outdoor activity.",
        5:"Health emergency. Everyone should avoid all outdoor activity. Masks mandatory."
    }
    enforce_map = {
        1:"Routine monitoring. No immediate action required.",
        2:"Monitor emission sources. Conduct scheduled inspections.",
        3:"Schedule inspections at flagged sites within 24 hours. Issue advisory.",
        4:"Deploy inspection teams immediately. Issue public health advisory. Restrict heavy vehicles.",
        5:"Emergency protocol. Close schools. Ban construction. Deploy all inspection teams now."
    }
    primary = sources[0] if sources else "Unknown source"
    label   = aqi_data["label"]
    verdict = f"{city}'s air quality is {label} today — {primary} is the primary source, with wind from {wind_dir} at {wind_spd} m/s {'dispersing' if wind_spd > 3 else 'trapping'} pollutants."
    prediction = (
        f"Wind at {wind_spd} m/s should improve AQI over next 6 hours." if wind_spd > 4
        else f"Low wind — pollutants will remain trapped, AQI likely to worsen." if wind_spd < 2
        else f"Moderate wind from {wind_dir} — AQI expected to remain stable."
    )
    return {
        "verdict":                  verdict,
        "risk_level":               risk_map[aqi],
        "primary_source":           primary,
        "health_impact":            health_map[aqi],
        "enforcement_order":        enforce_map[aqi],
        "citizen_advisory_local":   f"{city} mein aaj pradushan {label.lower()} hai. Savdhan rahein.",
        "citizen_advisory_english": f"Air quality in {city} is {label} today. Take necessary precautions.",
        "prediction":               prediction,
        "mode":                     "rule_based_fallback"
    }

def analyze_pollution(city: str, aqi_data: dict, weather_data: dict, attribution: dict, lang: str = "Hindi", state: str = "") -> dict:
    try:
        prompt = f"""
You are an AI pollution analyst for India's Urban Air Quality Intelligence system called "Air Prosecutor".

Analyze this real-time data for {city} ({state}) and respond ONLY in this exact JSON format with no extra text:

{{
  "verdict": "one sentence verdict like a prosecutor — who/what is responsible for today's air quality",
  "risk_level": "LOW or MEDIUM or HIGH or CRITICAL",
  "primary_source": "single biggest pollution source right now",
  "health_impact": "specific health impact for vulnerable groups in {city} today",
  "enforcement_order": "one specific actionable enforcement instruction for municipal authorities in {city}",
  "citizen_advisory_local": "10-15 word advisory written in {lang} script for citizens of {city}",
  "citizen_advisory_english": "10-15 word advisory in English for citizens of {city}",
  "prediction": "what will happen to AQI in next 6 hours based on wind and current data"
}}

Current Data:
- City: {city}, State: {state}
- Local Language: {lang}
- AQI Level: {aqi_data['level']} ({aqi_data['label']})
- PM2.5: {aqi_data['pm2_5']} µg/m³
- PM10: {aqi_data['pm10']} µg/m³
- NO2: {aqi_data['no2']} µg/m³
- CO: {aqi_data['co']} µg/m³
- Temperature: {weather_data['temp']}°C
- Wind: {weather_data['wind_speed']} m/s from {weather_data['wind_direction']}
- Humidity: {weather_data['humidity']}%
- Attribution Sources: {', '.join(attribution['sources'])}
- Enforcement Priority: {attribution['enforcement_priority']}

IMPORTANT: citizen_advisory_local MUST be written in {lang} script/language — not English transliteration.
For Tamil write in Tamil script, for Malayalam in Malayalam script, for Bengali in Bengali script, etc.
Be specific to {city}'s known geography and pollution sources.
"""
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role":"user","content":prompt}],
            max_tokens=1000
        )
        raw   = response.choices[0].message.content.strip()
        raw   = raw.replace("```json","").replace("```","").strip()
        start = raw.find("{")
        end   = raw.rfind("}") + 1
        if start != -1 and end != 0:
            raw = raw[start:end]
        return json.loads(raw)
    except Exception as e:
        return _rule_based_analysis(city, aqi_data, weather_data, attribution, str(e), lang)

def generate_enforcement_report(city: str, analysis: dict, aqi_data: dict) -> str:
    try:
        prompt = f"""
Generate a short formal enforcement report (max 150 words) for {city}'s pollution control authority.
- Risk Level: {analysis['risk_level']}
- Primary Source: {analysis['primary_source']}
- Verdict: {analysis['verdict']}
- Enforcement Order: {analysis['enforcement_order']}
- AQI: {aqi_data['level']} ({aqi_data['label']})
- PM2.5: {aqi_data['pm2_5']} µg/m³
Include: Date, City, Pollution Status, Source Attribution, Recommended Action, Urgency level.
"""
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role":"user","content":prompt}],
            max_tokens=500
        )
        return response.choices[0].message.content.strip()
    except Exception:
        return f"""ENFORCEMENT REPORT — {city.upper()}
Date: {datetime.now().strftime('%d %B %Y, %I:%M %p')}
Status: {aqi_data['label']} (AQI Level {aqi_data['level']})
PM2.5: {aqi_data['pm2_5']} µg/m³
SOURCE: {analysis['primary_source']}
ACTION: {analysis['enforcement_order']}
URGENCY: {analysis['risk_level']}
Issued by: Air Prosecutor AI""".strip()