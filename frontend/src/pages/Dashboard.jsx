import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import "leaflet/dist/leaflet.css"
import { getAllCities, getForecast, searchCities, AQI_COLORS, AQI_BG } from "../api"

const LANG_FLAGS = {
  Hindi:"🇮🇳", Marathi:"🟠", Bengali:"🟡", Tamil:"🔵",
  Telugu:"🟢", Kannada:"🟣", Malayalam:"🔴", Gujarati:"🟤",
  Punjabi:"🟡", Odia:"🔵", Assamese:"🟢"
}

function SearchBar({ onSelect }) {
  const [query,   setQuery]   = useState("")
  const [results, setResults] = useState([])
  const [open,    setOpen]    = useState(false)
  const [focused, setFocused] = useState(false)
  const ref = useRef()

  useEffect(() => {
    if (query.length < 2) { setResults([]); setOpen(false); return }
    const timer = setTimeout(() => {
      searchCities(query).then(d => {
        setResults(d.results || [])
        setOpen(true)
      })
    }, 280)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div ref={ref} style={{ position:"relative", marginBottom:12 }}>
      <motion.div
        animate={{ borderColor: focused ? "#3b82f6" : "#3b82f620" }}
        style={{
          display:"flex", alignItems:"center", gap:8,
          background:"rgba(17,24,39,0.9)",
          border:"1px solid #3b82f620",
          borderRadius:10, padding:"9px 12px",
          backdropFilter:"blur(10px)"
        }}>
        <motion.span
          animate={{ color: focused ? "#3b82f6" : "#4b5563" }}
          style={{ fontSize:14 }}>🔍</motion.span>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search any city across India..."
          style={{
            flex:1, background:"transparent", border:"none",
            outline:"none", color:"#f9fafb", fontSize:12,
            fontFamily:"Inter, sans-serif"
          }}
        />
        <AnimatePresence>
          {query && (
            <motion.span
              initial={{ opacity:0, scale:0.8 }}
              animate={{ opacity:1, scale:1 }}
              exit={{ opacity:0, scale:0.8 }}
              onClick={() => { setQuery(""); setResults([]); setOpen(false) }}
              style={{ cursor:"pointer", color:"#4b5563", fontSize:11, padding:"0 2px" }}>✕</motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity:0, y:-6, scale:0.98 }}
            animate={{ opacity:1, y:0,  scale:1 }}
            exit={{    opacity:0, y:-6, scale:0.98 }}
            transition={{ duration:0.15 }}
            style={{
              position:"absolute", top:"calc(100% + 6px)",
              left:0, right:0, zIndex:9999,
              background:"rgba(9,12,22,0.98)",
              border:"1px solid #3b82f630",
              borderRadius:12, overflow:"hidden",
              backdropFilter:"blur(24px)",
              boxShadow:"0 16px 48px #00000080"
            }}>
            <div style={{ padding:"6px 12px 4px", fontSize:9, color:"#374151", letterSpacing:"0.08em" }}>
              {results.length} CITIES FOUND
            </div>
            {results.map((r,i) => (
              <motion.div key={r.key}
                initial={{ opacity:0, x:-6 }}
                animate={{ opacity:1, x:0 }}
                transition={{ delay:i*0.03 }}
                onClick={() => {
                  onSelect(r.key)
                  setQuery(r.name)
                  setOpen(false)
                }}
                style={{
                  padding:"9px 12px", cursor:"pointer",
                  borderTop:"1px solid #0d1117",
                  display:"flex", justifyContent:"space-between", alignItems:"center",
                  transition:"background 0.12s"
                }}
                onMouseEnter={e => e.currentTarget.style.background="#111827"}
                onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                <div>
                  <div style={{ fontSize:13, color:"#f3f4f6", fontWeight:500 }}>{r.name}</div>
                  <div style={{ fontSize:10, color:"#4b5563", marginTop:1 }}>{r.state}</div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontSize:10, color:"#6b7280" }}>
                    {LANG_FLAGS[r.lang] || "🌐"}
                  </span>
                  <span style={{
                    fontSize:9, color:"#3b82f6",
                    background:"#1d4ed815",
                    border:"1px solid #3b82f625",
                    borderRadius:6, padding:"2px 7px",
                    fontFamily:"'JetBrains Mono',monospace"
                  }}>{r.lang}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
        {open && query.length >= 2 && results.length === 0 && (
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:1 }}
            style={{
              position:"absolute", top:"calc(100% + 6px)", left:0, right:0,
              background:"rgba(9,12,22,0.98)",
              border:"1px solid #1f2937", borderRadius:10,
              padding:"14px", fontSize:12, color:"#4b5563",
              textAlign:"center"
            }}>
            No cities found for "{query}"
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function PulsingMarker({ city, selected, onClick }) {
  const color = AQI_COLORS[city.aqi_level]
  return (
    <CircleMarker
      center={[city.lat, city.lon]}
      radius={selected ? 14 : 9}
      pathOptions={{ color, fillColor:color, fillOpacity:0.8, weight:2 }}
      eventHandlers={{ click:onClick }}>
      <Popup>
        <div style={{ fontFamily:"Inter", minWidth:150 }}>
          <div style={{ fontWeight:700, fontSize:14 }}>{city.city}</div>
          <div style={{ fontSize:11, color:"#6b7280", marginBottom:4 }}>{city.state}</div>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12 }}>
            <span style={{ color:"#6b7280" }}>AQI</span>
            <span style={{ color, fontWeight:600 }}>{city.aqi_label}</span>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12 }}>
            <span style={{ color:"#6b7280" }}>PM2.5</span>
            <span>{city.pm2_5} µg/m³</span>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:12 }}>
            <span style={{ color:"#6b7280" }}>Language</span>
            <span style={{ color:"#3b82f6" }}>{city.lang}</span>
          </div>
        </div>
      </Popup>
    </CircleMarker>
  )
}

export default function Dashboard() {
  const [cities,   setCities]   = useState([])
  const [forecast, setForecast] = useState([])
  const [selected, setSelected] = useState(null)
  const [selCity,  setSelCity]  = useState(null)
  const [filter,   setFilter]   = useState("all")
  const navigate = useNavigate()

  useEffect(() => {
    getAllCities().then(d => {
      setCities(d.cities)
      if (d.cities.length > 0) {
        handleSelect(d.cities[0].key, d.cities[0])
      }
    })
  }, [])

  const handleSelect = (cityKey, cityObj) => {
    setSelected(cityKey)
    setSelCity(cityObj)
    getForecast(cityKey).then(d => setForecast(
      d.next_24hrs.map(f => ({
        time: f.time.split(" ").slice(1).join(" "),
        aqi:  f.aqi_level
      }))
    ))
  }

  const filterOptions = [
    { key:"all",      label:"All India"  },
    { key:"critical", label:"🔴 Critical" },
    { key:"north",    label:"North"      },
    { key:"south",    label:"South"      },
    { key:"east",     label:"East"       },
    { key:"west",     label:"West"       },
  ]

  const northStates = ["Delhi","Uttar Pradesh","Rajasthan","Punjab","Chandigarh","Uttarakhand","Haryana"]
  const southStates = ["Karnataka","Tamil Nadu","Telangana","Andhra Pradesh","Kerala"]
  const eastStates  = ["West Bengal","Bihar","Jharkhand","Odisha","Assam"]
  const westStates  = ["Maharashtra","Gujarat","Madhya Pradesh","Chhattisgarh","Goa"]

  const filteredCities = cities.filter(c => {
    if (filter === "all")      return true
    if (filter === "critical") return c.aqi_level >= 4
    if (filter === "north")    return northStates.includes(c.state)
    if (filter === "south")    return southStates.includes(c.state)
    if (filter === "east")     return eastStates.includes(c.state)
    if (filter === "west")     return westStates.includes(c.state)
    return true
  })

  // ── PIN selected city to top ──────────────────────
  const sortedCities = selected
    ? [
        ...filteredCities.filter(c => c.key === selected),
        ...filteredCities.filter(c => c.key !== selected)
      ]
    : filteredCities

  const avgPM25  = cities.length ? (cities.reduce((a,c) => a+c.pm2_5, 0)/cities.length).toFixed(1) : "-"
  const badCount = cities.filter(c => c.aqi_level >= 3).length

  return (
    <motion.div className="page-enter"
      style={{ display:"grid", gridTemplateColumns:"290px 1fr", height:"calc(100vh - 56px)", overflow:"hidden" }}>

      {/* ── Left panel ── */}
      <div style={{
        borderRight:"1px solid #3b82f615",
        background:"rgba(5,8,16,0.97)",
        backdropFilter:"blur(20px)",
        overflowY:"auto", padding:14,
        display:"flex", flexDirection:"column", gap:10
      }}>

        {/* Search */}
        <SearchBar onSelect={(key) => {
          const found = cities.find(c => c.key === key)
          if (found) handleSelect(key, found)
          else handleSelect(key, { key, name:key, state:"", lang:"", aqi_level:1 })
        }} />

        {/* Stats row */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
          {[
            ["Cities",  cities.length, "#3b82f6"],
            ["At Risk", badCount,      "#ef4444"],
            ["Avg PM₂.₅", avgPM25,    "#f59e0b"],
          ].map(([label,val,color]) => (
            <div key={label} style={{
              background:"rgba(13,17,23,0.8)",
              border:"1px solid #1f2937",
              borderRadius:8, padding:"8px 6px", textAlign:"center"
            }}>
              <div style={{ fontSize:16, fontWeight:700, color,
                fontFamily:"'JetBrains Mono',monospace" }}>{val}</div>
              <div style={{ fontSize:9, color:"#4b5563", marginTop:1 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Region filter */}
        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
          {filterOptions.map(f => (
            <motion.button key={f.key}
              onClick={() => setFilter(f.key)}
              whileTap={{ scale:0.95 }}
              style={{
                background: filter===f.key ? "#1d4ed8" : "rgba(13,17,23,0.6)",
                border:`1px solid ${filter===f.key ? "#3b82f6" : "#1f2937"}`,
                color: filter===f.key ? "#fff" : "#6b7280",
                borderRadius:6, padding:"3px 8px",
                fontSize:10, cursor:"pointer",
                fontFamily:"Inter, sans-serif"
              }}>{f.label}</motion.button>
          ))}
        </div>

        {/* City count */}
        <div style={{ fontSize:10, color:"#374151", letterSpacing:"0.06em" }}>
          {sortedCities.length} CITIES · SELECTED PINNED TO TOP
        </div>

        {/* City cards */}
        {sortedCities.map((c,i) => {
          const color    = AQI_COLORS[c.aqi_level]
          const isActive = selected === c.key
          return (
            <motion.div key={c.key}
              layout
              initial={{ opacity:0, x:-16 }}
              animate={{ opacity:1, x:0 }}
              transition={{ layout:{ duration:0.3, ease:[0.16,1,0.3,1] }, delay:isActive ? 0 : Math.min(i*0.03, 0.25) }}
              onClick={() => handleSelect(c.key, c)}
              className="card-hover"
              style={{
                background: isActive
                  ? `linear-gradient(135deg,${AQI_BG[c.aqi_level]||"#0a2035"},#0d1117)`
                  : "rgba(13,17,23,0.6)",
                border:`1px solid ${isActive ? color+"60" : "#1f2937"}`,
                borderRadius:10, padding:"11px 13px",
                backdropFilter:"blur(10px)",
                boxShadow: isActive ? `0 0 24px ${color}20` : "none",
                outline: isActive ? `1px solid ${color}20` : "none"
              }}>

              {/* Pinned badge */}
              {isActive && i === 0 && (
                <motion.div
                  initial={{ opacity:0, scale:0.8 }}
                  animate={{ opacity:1, scale:1 }}
                  style={{
                    display:"inline-flex", alignItems:"center", gap:4,
                    fontSize:8, color:"#3b82f6",
                    background:"#1d4ed815",
                    border:"1px solid #3b82f625",
                    borderRadius:6, padding:"1px 6px",
                    marginBottom:6, letterSpacing:"0.06em"
                  }}>
                  📍 SELECTED
                </motion.div>
              )}

              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ fontWeight:600, fontSize:13, color: isActive ? "#f9fafb" : "#d1d5db" }}>
                    {c.city}
                  </div>
                  <div style={{ fontSize:10, color:"#374151", marginTop:1 }}>
                    {c.state} · {LANG_FLAGS[c.lang]||"🌐"} {c.lang}
                  </div>
                </div>
                <motion.span
                  animate={isActive ? { scale:[1,1.05,1] } : {}}
                  transition={{ duration:2, repeat:Infinity }}
                  style={{
                    background:`${color}22`,
                    border:`1px solid ${color}`,
                    color, borderRadius:20,
                    padding:"2px 9px", fontSize:9, fontWeight:700,
                    boxShadow:`0 0 8px ${color}30`
                  }}>{c.aqi_label}</motion.span>
              </div>

              <div style={{ display:"flex", gap:10, marginTop:7, fontSize:10 }}>
                {[["PM2.5",c.pm2_5],["PM10",c.pm10],["NO2",c.no2]].map(([k,v]) => (
                  <div key={k}>
                    <span style={{ color:"#374151" }}>{k} </span>
                    <span style={{ color:"#e2e8f0", fontFamily:"'JetBrains Mono',monospace", fontSize:10 }}>{v}</span>
                  </div>
                ))}
              </div>

              <AnimatePresence>
                {isActive && (
                  <motion.button
                    initial={{ opacity:0, height:0, marginTop:0 }}
                    animate={{ opacity:1, height:"auto", marginTop:8 }}
                    exit={{    opacity:0, height:0, marginTop:0 }}
                    onClick={e => { e.stopPropagation(); navigate(`/city/${c.key}`) }}
                    whileHover={{ scale:1.02 }}
                    whileTap={{ scale:0.97 }}
                    style={{
                      width:"100%",
                      background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",
                      border:"none", color:"#fff", borderRadius:7,
                      padding:"6px 0", fontSize:11, cursor:"pointer",
                      fontWeight:600, boxShadow:"0 0 14px #3b82f635"
                    }}>
                    🔍 Full AI Analysis →
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* ── Right: map + forecast ── */}
      <div style={{ display:"flex", flexDirection:"column", position:"relative" }}>

        <div style={{ flex:1, position:"relative" }}>
          <MapContainer center={[22,80]} zoom={5}
            style={{ width:"100%", height:"100%" }} zoomControl={false}>
            <TileLayer
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
attribution="&copy; OpenStreetMap contributors"
className="dark-tiles"
            />
            {cities.map(c => (
              <PulsingMarker key={c.key} city={c}
                selected={selected===c.key}
                onClick={() => handleSelect(c.key, c)} />
            ))}
          </MapContainer>

          {/* Selected city overlay */}
          <AnimatePresence>
            {selCity && (
              <motion.div key={selCity.key||selCity.city}
                initial={{ opacity:0, y:-8 }}
                animate={{ opacity:1, y:0 }}
                exit={{    opacity:0, y:-8 }}
                style={{
                  position:"absolute", top:14, right:14, zIndex:1000,
                  background:"rgba(5,8,16,0.9)",
                  backdropFilter:"blur(20px)",
                  border:`1px solid ${AQI_COLORS[selCity.aqi_level]||"#3b82f6"}40`,
                  borderRadius:12, padding:"12px 16px", minWidth:170,
                  boxShadow:`0 0 28px ${AQI_COLORS[selCity.aqi_level]||"#3b82f6"}18`
                }}>
                <div style={{ fontSize:9, color:"#4b5563", marginBottom:3 }}>📍 SELECTED</div>
                <div style={{ fontSize:17, fontWeight:700, color:"#f9fafb" }}>{selCity.city||selCity.name}</div>
                {selCity.state && <div style={{ fontSize:10, color:"#4b5563" }}>{selCity.state}</div>}
                {selCity.lang && (
                  <div style={{ fontSize:10, color:"#3b82f6", marginTop:2 }}>
                    {LANG_FLAGS[selCity.lang]||"🌐"} Advisory in {selCity.lang}
                  </div>
                )}
                {selCity.aqi_label && (
                  <div style={{
                    fontSize:13, fontWeight:600,
                    color:AQI_COLORS[selCity.aqi_level],
                    textShadow:`0 0 10px ${AQI_COLORS[selCity.aqi_level]}`,
                    marginTop:4
                  }}>{selCity.aqi_label}</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* India stats overlay */}
          <div style={{
            position:"absolute", bottom:175, left:14, zIndex:1000,
            background:"rgba(5,8,16,0.85)",
            backdropFilter:"blur(16px)",
            border:"1px solid #3b82f620",
            borderRadius:10, padding:"10px 14px"
          }}>
            <div style={{ fontSize:9, color:"#374151", marginBottom:6, letterSpacing:"0.06em" }}>
              🇮🇳 INDIA OVERVIEW
            </div>
            <div style={{ display:"flex", gap:14 }}>
              {[
                ["Cities",   cities.length, "#3b82f6"],
                ["Avg PM₂.₅", avgPM25,     "#f59e0b"],
                ["At Risk",  badCount,      "#ef4444"],
              ].map(([l,v,c]) => (
                <div key={l} style={{ textAlign:"center" }}>
                  <div style={{ fontSize:15, fontWeight:700, color:c,
                    fontFamily:"'JetBrains Mono',monospace" }}>{v}</div>
                  <div style={{ fontSize:9, color:"#4b5563" }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Forecast */}
        <motion.div
          initial={{ y:30, opacity:0 }}
          animate={{ y:0,  opacity:1 }}
          transition={{ delay:0.4 }}
          style={{
            height:162,
            background:"rgba(5,8,16,0.92)",
            backdropFilter:"blur(20px)",
            borderTop:"1px solid #3b82f615",
            padding:"10px 20px"
          }}>
          <div style={{ fontSize:9, color:"#374151", letterSpacing:"0.06em", marginBottom:6 }}>
            📈 24-HR AQI FORECAST — {selected ? selected.toUpperCase() : "SELECT A CITY"}
          </div>
          <ResponsiveContainer width="100%" height={118}>
            <AreaChart data={forecast}>
              <defs>
                <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fontSize:9, fill:"#374151" }} />
              <YAxis domain={[1,5]} ticks={[1,2,3,4,5]}
                tick={{ fontSize:9, fill:"#374151" }}
                tickFormatter={v => ["","G","F","M","P","VP"][v]} />
              <Tooltip contentStyle={{
                background:"#0d1117", border:"1px solid #3b82f630",
                borderRadius:10, fontSize:11
              }}/>
              <Area type="monotone" dataKey="aqi"
                stroke="#3b82f6" strokeWidth={2} fill="url(#ag)"
                dot={{ fill:"#3b82f6", r:3 }}
                isAnimationActive animationDuration={800} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </motion.div>
  )
}