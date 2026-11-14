import axios from "axios"

const BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"

export const getAllCities = ()           => axios.get(`${BASE}/all/cities`).then(r => r.data)
export const getAQI       = (city)       => axios.get(`${BASE}/aqi/${city}`).then(r => r.data)
export const getForecast  = (city)       => axios.get(`${BASE}/forecast/${city}`).then(r => r.data)
export const analyzeCity  = (city)       => axios.get(`${BASE}/analyze/${city}`).then(r => r.data)
export const searchCities = (q)          => axios.get(`${BASE}/search?q=${encodeURIComponent(q)}`).then(r => r.data)
export const getHistory   = (city, days=7) => axios.get(`${BASE}/history/${city}?days=${days}`).then(r => r.data)

export const AQI_COLORS = { 1:"#00e400", 2:"#ffff00", 3:"#ff7e00", 4:"#ff0000", 5:"#8f3f97" }
export const AQI_BG     = { 1:"#0a2e0a", 2:"#2e2a00", 3:"#2e1800", 4:"#2e0000", 5:"#1a0a2e" }

export const CITIES = [
  "delhi","mumbai","kolkata","bengaluru","chennai",
  "hyderabad","pune","ahmedabad","jaipur","lucknow",
  "kanpur","nagpur","indore","bhopal","patna",
  "ludhiana","agra","nashik","vadodara","surat",
  "rajkot","meerut","varanasi","amritsar","allahabad",
  "ranchi","guwahati","chandigarh","coimbatore","kochi",
  "visakhapatnam","bhubaneswar","thiruvananthapuram","raipur","dehradun"
]