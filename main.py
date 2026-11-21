from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests
import os
import time
from collections import defaultdict
from dotenv import load_dotenv
from datetime import datetime
from ai_agent import analyze_pollution, generate_enforcement_report

load_dotenv()

API_KEY = os.getenv("OPENWEATHER_API_KEY")

# ── Cache ─────────────────────────────────────────────
_cache    = {}
CACHE_TTL = 300

def cached_get(url: str) -> dict:
    now = time.time()
    if url in _cache and now - _cache[url]["ts"] < CACHE_TTL:
        return _cache[url]["data"]
    data = requests.get(url).json()
    _cache[url] = {"data": data, "ts": now}
    return data

# ── Cities ────────────────────────────────────────────
CITIES = {
    "delhi":              {"lat":28.6139, "lon":77.2090,  "name":"Delhi",              "state":"Delhi",              "lang":"Hindi",      "lang_code":"hi"},
    "lucknow":            {"lat":26.8467, "lon":80.9462,  "name":"Lucknow",            "state":"Uttar Pradesh",      "lang":"Hindi",      "lang_code":"hi"},
    "kanpur":             {"lat":26.4499, "lon":80.3319,  "name":"Kanpur",             "state":"Uttar Pradesh",      "lang":"Hindi",      "lang_code":"hi"},
    "agra":               {"lat":27.1767, "lon":78.0081,  "name":"Agra",               "state":"Uttar Pradesh",      "lang":"Hindi",      "lang_code":"hi"},
    "varanasi":           {"lat":25.3176, "lon":82.9739,  "name":"Varanasi",           "state":"Uttar Pradesh",      "lang":"Hindi",      "lang_code":"hi"},
    "allahabad":          {"lat":25.4358, "lon":81.8463,  "name":"Prayagraj",          "state":"Uttar Pradesh",      "lang":"Hindi",      "lang_code":"hi"},
    "meerut":             {"lat":28.9845, "lon":77.7064,  "name":"Meerut",             "state":"Uttar Pradesh",      "lang":"Hindi",      "lang_code":"hi"},
    "jaipur":             {"lat":26.9124, "lon":75.7873,  "name":"Jaipur",             "state":"Rajasthan",          "lang":"Hindi",      "lang_code":"hi"},
    "ludhiana":           {"lat":30.9010, "lon":75.8573,  "name":"Ludhiana",           "state":"Punjab",             "lang":"Punjabi",    "lang_code":"pa"},
    "amritsar":           {"lat":31.6340, "lon":74.8723,  "name":"Amritsar",           "state":"Punjab",             "lang":"Punjabi",    "lang_code":"pa"},
    "chandigarh":         {"lat":30.7333, "lon":76.7794,  "name":"Chandigarh",         "state":"Chandigarh",         "lang":"Hindi",      "lang_code":"hi"},
    "dehradun":           {"lat":30.3165, "lon":78.0322,  "name":"Dehradun",           "state":"Uttarakhand",        "lang":"Hindi",      "lang_code":"hi"},
    "mumbai":             {"lat":19.0760, "lon":72.8777,  "name":"Mumbai",             "state":"Maharashtra",        "lang":"Marathi",    "lang_code":"mr"},
    "pune":               {"lat":18.5204, "lon":73.8567,  "name":"Pune",               "state":"Maharashtra",        "lang":"Marathi",    "lang_code":"mr"},
    "nagpur":             {"lat":21.1458, "lon":79.0882,  "name":"Nagpur",             "state":"Maharashtra",        "lang":"Marathi",    "lang_code":"mr"},
    "nashik":             {"lat":19.9975, "lon":73.7898,  "name":"Nashik",             "state":"Maharashtra",        "lang":"Marathi",    "lang_code":"mr"},
    "ahmedabad":          {"lat":23.0225, "lon":72.5714,  "name":"Ahmedabad",          "state":"Gujarat",            "lang":"Gujarati",   "lang_code":"gu"},
    "surat":              {"lat":21.1702, "lon":72.8311,  "name":"Surat",              "state":"Gujarat",            "lang":"Gujarati",   "lang_code":"gu"},
    "vadodara":           {"lat":22.3072, "lon":73.1812,  "name":"Vadodara",           "state":"Gujarat",            "lang":"Gujarati",   "lang_code":"gu"},
    "rajkot":             {"lat":22.3039, "lon":70.8022,  "name":"Rajkot",             "state":"Gujarat",            "lang":"Gujarati",   "lang_code":"gu"},
    "bhopal":             {"lat":23.2599, "lon":77.4126,  "name":"Bhopal",             "state":"Madhya Pradesh",     "lang":"Hindi",      "lang_code":"hi"},
    "indore":             {"lat":22.7196, "lon":75.8577,  "name":"Indore",             "state":"Madhya Pradesh",     "lang":"Hindi",      "lang_code":"hi"},
    "raipur":             {"lat":21.2514, "lon":81.6296,  "name":"Raipur",             "state":"Chhattisgarh",       "lang":"Hindi",      "lang_code":"hi"},
    "kolkata":            {"lat":22.5726, "lon":88.3639,  "name":"Kolkata",            "state":"West Bengal",        "lang":"Bengali",    "lang_code":"bn"},
    "patna":              {"lat":25.5941, "lon":85.1376,  "name":"Patna",              "state":"Bihar",              "lang":"Hindi",      "lang_code":"hi"},
    "ranchi":             {"lat":23.3441, "lon":85.3096,  "name":"Ranchi",             "state":"Jharkhand",          "lang":"Hindi",      "lang_code":"hi"},
    "bhubaneswar":        {"lat":20.2961, "lon":85.8245,  "name":"Bhubaneswar",        "state":"Odisha",             "lang":"Odia",       "lang_code":"or"},
    "guwahati":           {"lat":26.1445, "lon":91.7362,  "name":"Guwahati",           "state":"Assam",              "lang":"Assamese",   "lang_code":"as"},
    "bengaluru":          {"lat":12.9716, "lon":77.5946,  "name":"Bengaluru",          "state":"Karnataka",          "lang":"Kannada",    "lang_code":"kn"},
    "chennai":            {"lat":13.0827, "lon":80.2707,  "name":"Chennai",            "state":"Tamil Nadu",         "lang":"Tamil",      "lang_code":"ta"},
    "hyderabad":          {"lat":17.3850, "lon":78.4867,  "name":"Hyderabad",          "state":"Telangana",          "lang":"Telugu",     "lang_code":"te"},
    "visakhapatnam":      {"lat":17.6868, "lon":83.2185,  "name":"Visakhapatnam",      "state":"Andhra Pradesh",     "lang":"Telugu",     "lang_code":"te"},
    "coimbatore":         {"lat":11.0168, "lon":76.9558,  "name":"Coimbatore",         "state":"Tamil Nadu",         "lang":"Tamil",      "lang_code":"ta"},
    "kochi":              {"lat":9.9312,  "lon":76.2673,  "name":"Kochi",              "state":"Kerala",             "lang":"Malayalam",  "lang_code":"ml"},
    "thiruvananthapuram": {"lat":8.5241,  "lon":76.9366,  "name":"Thiruvananthapuram", "state":"Kerala",             "lang":"Malayalam",  "lang_code":"ml"},
}

app = FastAPI(title="Air Prosecutor API")
@app.api_route("/health", methods=["GET", "HEAD"])
def health():
    return {"status": "ok"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_wind_direction(deg):
    dirs = ["N","NE","E","SE","S","SW","W","NW"]
    return dirs[round(deg/45) % 8]

def attribute_sources(wind_speed, wind_dir, pm25, no2, co, city):
    sources    = []
    confidence = {}

    if wind_speed < 2:
        sources.append("Local traffic & construction (stagnant air)")
        confidence["traffic"] = 75
    if no2 > 20:
        sources.append("Vehicle emissions (elevated NO2)")
        confidence["vehicles"] = 80
    if co > 500:
        sources.append("Industrial combustion or waste burning (high CO)")
        confidence["industrial"] = 70

    city_wind_sources = {
        "delhi":          {"N":"Haryana stubble burning corridor","NE":"Ghaziabad industrial zone","E":"UP industrial belt","SE":"Faridabad manufacturing cluster","S":"Gurugram vehicle & construction emissions","SW":"Rajasthan dust storms","W":"Punjab agricultural burning","NW":"Punjab / Haryana crop burning (critical Oct-Nov)"},
        "mumbai":         {"N":"Thane industrial corridor","NE":"Navi Mumbai industrial zone","E":"Trombay / BPCL refinery area","SE":"Chembur industrial cluster","S":"Sea breeze — flushing pollutants (good)","SW":"Arabian Sea — generally clean","W":"Dharavi / western suburbs traffic","NW":"Vasai-Virar industrial belt"},
        "kolkata":        {"N":"Hooghly industrial belt","NE":"Barasat traffic corridor","E":"Salt Lake IT & construction zone","SE":"Garden Reach industrial area","S":"Bay of Bengal sea breeze (good)","SW":"Howrah heavy industries","W":"Howrah bridge & port emissions","NW":"Dunlop industrial cluster"},
        "bengaluru":      {"N":"Peenya industrial area","NE":"Hebbal flyover traffic corridor","E":"Whitefield IT construction boom","SE":"Electronic City industrial zone","S":"Bannerghatta road traffic","SW":"Kengeri construction activity","W":"Rajajinagar industrial cluster","NW":"Yeshwanthpur freight corridor"},
        "chennai":        {"N":"Ennore port & thermal plant","NE":"North Chennai industrial zone","E":"Bay of Bengal sea breeze (good)","SE":"Manali petrochemical complex","S":"OMR IT corridor construction","SW":"Ambattur industrial estate","W":"Poonamallee highway traffic","NW":"Tiruvallur industrial belt"},
        "hyderabad":      {"N":"Medchal industrial corridor","NE":"Secunderabad cantonment traffic","E":"LB Nagar industrial area","SE":"Fab City manufacturing zone","S":"Rajendranagar construction belt","SW":"Shadnagar industrial cluster","W":"Patancheru chemical industries","NW":"Miyapur construction activity"},
        "pune":           {"N":"Pimpri-Chinchwad auto industries","NE":"Alandi construction zone","E":"Wagholi IT corridor","SE":"Hadapsar manufacturing","S":"Katraj traffic corridor","SW":"Sinhagad road construction","W":"Hinjewadi IT park traffic","NW":"Talegaon industrial estate"},
        "ahmedabad":      {"N":"Mehsana industrial belt","NE":"Naroda textile industries","E":"Vatva chemical cluster","SE":"Narol industrial area","S":"Sanand manufacturing zone","SW":"Sarkhej construction","W":"Changodar logistics corridor","NW":"Bavla industrial estate"},
        "lucknow":        {"N":"Sitapur road industrial belt","NE":"Barabanki agricultural zone","E":"Faizabad road construction","SE":"Raebareli industrial corridor","S":"Kanpur road freight traffic","SW":"Unnao industrial cluster","W":"Hardoi agricultural burning","NW":"Sitapur highway traffic"},
        "jaipur":         {"N":"Chomu industrial area","NE":"Sikar road dust corridor","E":"Agra road freight highway","SE":"Tonk road construction zone","S":"Sanganer textile dyeing cluster","SW":"Ajmer road vehicle emissions","W":"Rajasthan desert dust storms","NW":"Jhunjhunu mining belt"},
        "kochi":          {"N":"Aluva industrial zone","NE":"Angamaly construction belt","E":"Perumbavoor timber mills","SE":"Kakkanad IT corridor","S":"Vembanad backwaters (clean)","SW":"Arabian Sea breeze (good)","W":"Arabian Sea — generally clean","NW":"Eloor chemical industries"},
        "guwahati":       {"N":"Brahmaputra riverbanks","NE":"North Guwahati construction","E":"Jorhat tea industry corridor","SE":"Bongaigaon refinery belt","S":"Meghalaya hills (clean)","SW":"Boko agricultural burning","W":"Kamrup agricultural zone","NW":"Nalbari paddy burning"},
    }

    default_wind = {"N":"Northern industrial belt","NE":"Northeast industrial zone","E":"Eastern freight corridor","SE":"Southeast manufacturing cluster","S":"Southern sea or agricultural land","SW":"Southwest construction activity","W":"Western traffic corridor","NW":"Northwest industrial belt"}
    wind_map     = city_wind_sources.get(city, default_wind)
    wind_source  = wind_map.get(wind_dir, "Unknown corridor")
    sources.append(f"Wind from {wind_dir}: {wind_source}")

    if pm25 > 60:
        sources.append("Severe particulate event — possible construction or fire")
        confidence["particulate"] = 85

    return sources, confidence

def get_enforcement_action(city, aqi_level, sources):
    actions = []
    if aqi_level >= 4:
        actions.append("🚨 Deploy inspection teams to identified source zones immediately")
        actions.append("📢 Issue public health advisory — avoid outdoor activity")
        actions.append("🏫 Consider school closure advisory")
    elif aqi_level == 3:
        actions.append("⚠️ Schedule inspections for flagged emission sources within 24hrs")
        actions.append("📊 Increase monitoring frequency at hotspot stations")
    else:
        actions.append("✅ Routine monitoring — no immediate action required")

    for source in sources:
        if "construction" in source.lower():
            actions.append("🏗️ Inspect active construction sites for dust suppression compliance")
        if "vehicle" in source.lower() or "traffic" in source.lower():
            actions.append("🚗 Deploy traffic police for odd-even or truck entry restrictions")
        if "industrial" in source.lower() or "refinery" in source.lower() or "chemical" in source.lower():
            actions.append("🏭 Issue notice to industries in flagged corridor")
        if "burning" in source.lower() or "stubble" in source.lower():
            actions.append("🔥 Alert district agriculture officers — stubble burning detected")

    return list(dict.fromkeys(actions))


# ── Routes ────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "message":    "Air Prosecutor API 🚀",
        "cities":     len(CITIES),
        "cache_size": len(_cache)
    }

@app.get("/search")
def search_cities(q: str = ""):
    q = q.lower().strip()
    if not q or len(q) < 2:
        return {"results": []}
    matches = []
    for key, c in CITIES.items():
        if (q in key or q in c["name"].lower() or
            q in c["state"].lower() or q in c["lang"].lower()):
            matches.append({
                "key":   key,
                "name":  c["name"],
                "state": c["state"],
                "lang":  c["lang"],
                "lat":   c["lat"],
                "lon":   c["lon"]
            })
    return {"results": matches[:10]}

@app.get("/all/cities")
def get_all_cities():
    results = []
    labels  = {1:"Good",2:"Fair",3:"Moderate",4:"Poor",5:"Very Poor"}
    colors  = {1:"#00e400",2:"#ffff00",3:"#ff7e00",4:"#ff0000",5:"#8f3f97"}
    for key, c in CITIES.items():
        url  = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={c['lat']}&lon={c['lon']}&appid={API_KEY}"
        data = cached_get(url)["list"][0]
        aqi  = data["main"]["aqi"]
        results.append({
            "city":      c["name"],
            "key":       key,
            "state":     c["state"],
            "lang":      c["lang"],
            "aqi_level": aqi,
            "aqi_label": labels[aqi],
            "color":     colors[aqi],
            "pm2_5":     round(data["components"]["pm2_5"], 2),
            "pm10":      round(data["components"]["pm10"],  2),
            "no2":       round(data["components"]["no2"],   2),
            "lat":       c["lat"],
            "lon":       c["lon"]
        })
    results.sort(key=lambda x: x["aqi_level"], reverse=True)
    return {
        "cities":     results,
        "timestamp":  datetime.now().isoformat(),
        "worst_city": results[0]["city"] if results else None,
        "cached":     True
    }

@app.get("/aqi/{city}")
def get_aqi(city: str):
    city_key = city.lower()
    if city_key not in CITIES:
        return {"error": f"City not found."}

    c   = CITIES[city_key]
    LAT = c["lat"]
    LON = c["lon"]

    aqi_url     = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={LAT}&lon={LON}&appid={API_KEY}"
    weather_url = f"http://api.openweathermap.org/data/2.5/weather?lat={LAT}&lon={LON}&appid={API_KEY}&units=metric"

    aqi_data   = cached_get(aqi_url)["list"][0]
    weather    = cached_get(weather_url)

    aqi        = aqi_data["main"]["aqi"]
    comp       = aqi_data["components"]
    wind_speed = weather["wind"]["speed"]
    wind_deg   = weather["wind"]["deg"]
    wind_dir   = get_wind_direction(wind_deg)
    temp       = weather["main"]["temp"]
    humidity   = weather["main"]["humidity"]

    labels = {1:"Good",2:"Fair",3:"Moderate",4:"Poor",5:"Very Poor"}
    sources, confidence = attribute_sources(
        wind_speed, wind_dir,
        comp["pm2_5"], comp["no2"], comp["co"],
        city_key
    )
    enforcement = get_enforcement_action(city_key, aqi, sources)

    return {
        "city":      c["name"],
        "state":     c.get("state", ""),
        "lang":      c.get("lang",  "Hindi"),
        "timestamp": datetime.now().isoformat(),
        "aqi": {
            "level": aqi,
            "label": labels[aqi],
            "pm2_5": round(comp["pm2_5"], 2),
            "pm10":  round(comp["pm10"],  2),
            "no2":   round(comp["no2"],   2),
            "co":    round(comp["co"],    2),
            "o3":    round(comp["o3"],    2)
        },
        "weather": {
            "temp":           temp,
            "humidity":       humidity,
            "wind_speed":     wind_speed,
            "wind_direction": wind_dir
        },
        "attribution": {
            "sources":              sources,
            "confidence_scores":    confidence,
            "enforcement_priority": "HIGH" if aqi >= 4 else "MEDIUM" if aqi == 3 else "LOW"
        },
        "enforcement_actions": enforcement
    }

@app.get("/forecast/{city}")
def get_forecast(city: str):
    city_key = city.lower()
    if city_key not in CITIES:
        return {"error": "City not found."}

    c    = CITIES[city_key]
    url  = f"http://api.openweathermap.org/data/2.5/air_pollution/forecast?lat={c['lat']}&lon={c['lon']}&appid={API_KEY}"
    data = cached_get(url)

    labels  = {1:"Good",2:"Fair",3:"Moderate",4:"Poor",5:"Very Poor"}
    colors  = {1:"#00e400",2:"#ffff00",3:"#ff7e00",4:"#ff0000",5:"#8f3f97"}
    forecast = []
    for item in data["list"][:8]:
        aqi = item["main"]["aqi"]
        forecast.append({
            "time":      datetime.fromtimestamp(item["dt"]).strftime("%d %b %I:%M %p"),
            "aqi_level": aqi,
            "aqi_label": labels[aqi],
            "color":     colors[aqi],
            "pm2_5":     round(item["components"]["pm2_5"], 2)
        })

    return {
        "city":       c["name"],
        "next_24hrs": forecast,
        "timestamp":  datetime.now().isoformat()
    }

@app.get("/analyze/{city}")
def analyze_city(city: str):
    city_key = city.lower()
    if city_key not in CITIES:
        return {"error": "City not found."}

    c                  = CITIES[city_key]
    aqi_response       = get_aqi(city_key)
    aqi_data           = aqi_response["aqi"]
    weather_data       = aqi_response["weather"]
    attribution        = aqi_response["attribution"]

    analysis           = analyze_pollution(
        city_key, aqi_data, weather_data, attribution,
        lang  = c.get("lang",  "Hindi"),
        state = c.get("state", "")
    )
    enforcement_report = generate_enforcement_report(city_key, analysis, aqi_data)

    return {
        "city":               c["name"],
        "state":              c.get("state", ""),
        "language":           c.get("lang",  "Hindi"),
        "timestamp":          aqi_response["timestamp"],
        "aqi":                aqi_data,
        "weather":            weather_data,
        "attribution":        attribution,
        "ai_analysis":        analysis,
        "enforcement_report": enforcement_report
    }

@app.get("/history/{city}")
def get_history(city: str, days: int = 7):
    city_key = city.lower()
    if city_key not in CITIES:
        return {"error": "City not found."}

    c     = CITIES[city_key]
    now   = int(time.time())
    start = now - (days * 24 * 60 * 60)

    url  = f"http://api.openweathermap.org/data/2.5/air_pollution/history?lat={c['lat']}&lon={c['lon']}&start={start}&end={now}&appid={API_KEY}"
    data = cached_get(url)

    labels = {1:"Good",2:"Fair",3:"Moderate",4:"Poor",5:"Very Poor"}
    colors = {1:"#00e400",2:"#ffff00",3:"#ff7e00",4:"#ff0000",5:"#8f3f97"}

    history = []
    for i, item in enumerate(data["list"]):
        if i % 6 == 0:
            aqi = item["main"]["aqi"]
            history.append({
                "time":      datetime.fromtimestamp(item["dt"]).strftime("%d %b %I%p"),
                "timestamp": item["dt"],
                "aqi_level": aqi,
                "aqi_label": labels[aqi],
                "color":     colors[aqi],
                "pm2_5":     round(item["components"]["pm2_5"], 2),
                "pm10":      round(item["components"]["pm10"],  2),
                "no2":       round(item["components"]["no2"],   2),
            })

    daily = defaultdict(list)
    for item in data["list"]:
        day = datetime.fromtimestamp(item["dt"]).strftime("%d %b")
        daily[day].append(item["main"]["aqi"])

    daily_avg = []
    for day, aqis in daily.items():
        avg = round(sum(aqis) / len(aqis), 1)
        daily_avg.append({
            "date":      day,
            "aqi_avg":   avg,
            "aqi_label": labels[round(avg)],
            "color":     colors[round(avg)],
        })

    return {
        "city":      c["name"],
        "days":      days,
        "history":   history,
        "daily_avg": daily_avg,
        "timestamp": datetime.now().isoformat()
    }
   