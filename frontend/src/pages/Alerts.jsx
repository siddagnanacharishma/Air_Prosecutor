import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { getForecast, searchCities, getAllCities, AQI_COLORS, CITIES } from "../api"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

const PRIMARY_CITIES = ["delhi","mumbai","kolkata","bengaluru","chennai"]
const CHART_COLORS   = ["#3b82f6","#10b981","#f59e0b","#8b5cf6","#ef4444","#06b6d4","#ec4899","#84cc16"]

function CitySearchBar({ onAdd, excludeKeys }) {
  const [query,   setQuery]   = useState("")
  const [results, setResults] = useState([])
  const [open,    setOpen]    = useState(false)

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const t = setTimeout(() => {
      searchCities(query).then(d => {
        setResults((d.results||[]).filter(r => !excludeKeys.includes(r.key)))
        setOpen(true)
      })
    }, 250)
    return () => clearTimeout(t)
  }, [query, excludeKeys])

  return (
    <div style={{ position:"relative", width:280 }}>
      <div style={{
        display:"flex", alignItems:"center", gap:8,
        background:"rgba(17,24,39,0.9)",
        border:"1px solid #3b82f630",
        borderRadius:9, padding:"7px 12px"
      }}>
        <span style={{ fontSize:12 }}>🔍</span>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Add a city to compare..."
          style={{
            flex:1, background:"transparent", border:"none", outline:"none",
            color:"#f9fafb", fontSize:12, fontFamily:"Inter, sans-serif"
          }}
        />
      </div>
      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-6 }}
            style={{
              position:"absolute", top:"calc(100% + 6px)", left:0, right:0, zIndex:999,
              background:"rgba(9,12,22,0.98)", border:"1px solid #3b82f630",
              borderRadius:10, overflow:"hidden", backdropFilter:"blur(20px)",
              maxHeight:240, overflowY:"auto"
            }}>
            {results.map(r => (
              <div key={r.key}
                onClick={() => { onAdd(r.key); setQuery(""); setOpen(false) }}
                style={{
                  padding:"8px 12px", cursor:"pointer", fontSize:12,
                  borderTop:"1px solid #0d1117", color:"#e2e8f0",
                  display:"flex", justifyContent:"space-between"
                }}
                onMouseEnter={e => e.currentTarget.style.background="#111827"}
                onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                <span>{r.name}</span>
                <span style={{ color:"#4b5563", fontSize:10 }}>{r.state}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Alerts() {
  const [activeCities, setActiveCities] = useState(PRIMARY_CITIES)
  const [allForecasts, setAllForecasts] = useState({})
  const [combined,     setCombined]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [cityMeta,     setCityMeta]     = useState({})

  useEffect(() => {
    getAllCities().then(d => {
      const meta = {}
      d.cities.forEach(c => { meta[c.key] = c })
      setCityMeta(meta)
    })
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all(activeCities.map(c => getForecast(c).then(d => ({ city:c, data:d.next_24hrs }))))
    .then(results => {
      const map = {}
      results.forEach(r => { map[r.city] = r.data })
      setAllForecasts(map)

      const times = results[0]?.data.map(x => x.time.split(" ").slice(1).join(" ")) || []
      const comb  = times.map((t,i) => {
        const row = { time:t }
        results.forEach(r => { row[r.city] = r.data[i]?.aqi_level || null })
        return row
      })
      setCombined(comb)
      setLoading(false)
    })
  }, [activeCities])

  const addCity = (key) => {
    if (!activeCities.includes(key) && activeCities.length < 8) {
      setActiveCities([...activeCities, key])
    }
  }
  const removeCity = (key) => {
    setActiveCities(activeCities.filter(c => c !== key))
  }

  if (loading && Object.keys(allForecasts).length === 0) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
      height:"calc(100vh - 56px)", flexDirection:"column", gap:16 }}>
      <motion.div
        animate={{ rotate:360 }}
        transition={{ duration:2, repeat:Infinity, ease:"linear" }}
        style={{ width:48, height:48, borderRadius:"50%",
          border:"3px solid #1f2937", borderTopColor:"#3b82f6",
          boxShadow:"0 0 20px #3b82f640" }}/>
      <p style={{ color:"#6b7280", fontSize:13 }}>Loading alert history...</p>
    </div>
  )

  return (
    <motion.div className="page-enter"
      style={{ padding:24, overflowY:"auto", height:"calc(100vh - 56px)" }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:20, flexWrap:"wrap", gap:12 }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:700, color:"#f9fafb", letterSpacing:"-0.02em" }}>
            📅 Alert History & Forecast
          </h2>
          <p style={{ fontSize:12, color:"#4b5563", marginTop:4 }}>
            24-hour AQI comparison · {activeCities.length}/8 cities selected
          </p>
        </div>
        <CitySearchBar onAdd={addCity} excludeKeys={activeCities} />
      </div>

      {/* Active city chips */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:20 }}>
        {activeCities.map((c,i) => (
          <motion.div key={c}
            initial={{ opacity:0, scale:0.8 }}
            animate={{ opacity:1, scale:1 }}
            style={{
              display:"flex", alignItems:"center", gap:6,
              background:`${CHART_COLORS[i%CHART_COLORS.length]}15`,
              border:`1px solid ${CHART_COLORS[i%CHART_COLORS.length]}50`,
              borderRadius:20, padding:"5px 6px 5px 12px"
            }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:CHART_COLORS[i%CHART_COLORS.length] }}/>
            <span style={{ fontSize:12, color:"#e2e8f0", fontWeight:500 }}>
              {cityMeta[c]?.city || c.charAt(0).toUpperCase()+c.slice(1)}
            </span>
            {activeCities.length > 1 && (
              <span onClick={() => removeCity(c)}
                style={{ cursor:"pointer", color:"#6b7280", fontSize:11, padding:"0 4px" }}>✕</span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Combined chart — NO legend overflow, uses chips above instead */}
      <motion.div
        initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
        style={{
          background:"rgba(13,17,23,0.8)", backdropFilter:"blur(20px)",
          border:"1px solid #1f2937", borderRadius:16, padding:20, marginBottom:20
        }}>
        <div style={{ fontSize:10, color:"#4b5563", letterSpacing:"0.06em", marginBottom:14 }}>
          📊 AQI TREND — SELECTED CITIES (next 24 hours)
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={combined} margin={{ top:10, right:20, left:0, bottom:0 }}>
            <defs>
              {activeCities.map((c,i) => (
                <linearGradient key={c} id={`grad_${c}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={CHART_COLORS[i%CHART_COLORS.length]} stopOpacity={0.25}/>
                  <stop offset="95%" stopColor={CHART_COLORS[i%CHART_COLORS.length]} stopOpacity={0}/>
                </linearGradient>
              ))}
            </defs>
            <XAxis dataKey="time" tick={{ fontSize:9, fill:"#374151" }} />
            <YAxis domain={[1,5]} ticks={[1,2,3,4,5]}
              tick={{ fontSize:9, fill:"#374151" }}
              tickFormatter={v => ["","Good","Fair","Mod","Poor","V.Poor"][v]} />
            <Tooltip contentStyle={{
              background:"#0d1117", border:"1px solid #3b82f630",
              borderRadius:10, fontSize:11, maxHeight:200, overflowY:"auto"
            }}/>
            {/* No <Legend> — chips above the chart serve that purpose, no overflow */}
            {activeCities.map((c,i) => (
              <Area key={c} type="monotone" dataKey={c}
                name={cityMeta[c]?.city || c}
                stroke={CHART_COLORS[i%CHART_COLORS.length]} strokeWidth={2}
                fill={`url(#grad_${c})`} dot={false}
                isAnimationActive animationDuration={800} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Per-city timeline cards — grid that fits however many are selected */}
      <div style={{
        display:"grid",
        gridTemplateColumns: activeCities.length <= 2 ? "1fr 1fr" : "1fr 1fr 1fr",
        gap:14
      }}>
        {activeCities.map((c,ci) => {
          const data = allForecasts[c] || []
          const meta = cityMeta[c]
          return (
            <motion.div key={c}
              initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
              transition={{ delay:ci*0.06+0.15 }}
              style={{
                background:"rgba(13,17,23,0.8)", backdropFilter:"blur(20px)",
                border:"1px solid #1f2937",
                borderTop:`2px solid ${CHART_COLORS[ci%CHART_COLORS.length]}`,
                borderRadius:14, padding:14
              }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <div style={{ fontSize:12, color:CHART_COLORS[ci%CHART_COLORS.length], fontWeight:600 }}>
                  {meta?.city || c}
                </div>
                {activeCities.length > 1 && (
                  <span onClick={() => removeCity(c)}
                    style={{ cursor:"pointer", color:"#374151", fontSize:11 }}>✕</span>
                )}
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                {data.slice(0,6).map((item,i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:7 }}>
                    <div style={{
                      width:6, height:6, borderRadius:"50%", flexShrink:0,
                      background:AQI_COLORS[item.aqi_level]
                    }}/>
                    <span style={{ fontSize:9, color:"#4b5563", width:62, flexShrink:0,
                      fontFamily:"'JetBrains Mono',monospace" }}>{item.time}</span>
                    <div style={{ flex:1, height:4, background:"#1f2937", borderRadius:4, overflow:"hidden" }}>
                      <motion.div
                        initial={{ width:0 }}
                        animate={{ width:`${((item.aqi_level-1)/4)*100}%` }}
                        transition={{ duration:0.5, delay:i*0.03 }}
                        style={{ height:"100%", borderRadius:4, background:AQI_COLORS[item.aqi_level] }}/>
                    </div>
                    <span style={{ fontSize:9, color:AQI_COLORS[item.aqi_level], width:38, textAlign:"right" }}>
                      {item.aqi_label}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )
        })}
      </div>

      {activeCities.length === 0 && (
        <div style={{ textAlign:"center", padding:40, color:"#4b5563", fontSize:13 }}>
          Search and add cities above to compare their air quality
        </div>
      )}
    </motion.div>
  )
}