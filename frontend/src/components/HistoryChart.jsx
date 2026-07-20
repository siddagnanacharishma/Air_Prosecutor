import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, BarChart, Bar, Cell
} from "recharts"
import { getHistory } from "../api"

const AQI_COLORS = { 1:"#00e400", 2:"#ffff00", 3:"#ff7e00", 4:"#ff0000", 5:"#8f3f97" }
const AQI_LABELS = { 1:"Good", 2:"Fair", 3:"Moderate", 4:"Poor", 5:"Very Poor" }

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  const color = AQI_COLORS[Math.round(d.value)] || "#888"
  return (
    <div style={{
      background:"#0d1117", border:"1px solid #3b82f630",
      borderRadius:10, padding:"10px 14px", fontSize:11
    }}>
      <div style={{ color:"#6b7280", marginBottom:4 }}>{label}</div>
      <div style={{ color, fontWeight:700, fontSize:14 }}>
        AQI {d.value} — {AQI_LABELS[Math.round(d.value)] || ""}
      </div>
      {payload[1] && (
        <div style={{ color:"#9ca3af", marginTop:3 }}>
          PM2.5: {payload[1].value} µg/m³
        </div>
      )}
    </div>
  )
}

export default function HistoryChart({ city }) {
  const [data,    setData]    = useState(null)
  const [days,    setDays]    = useState(7)
  const [loading, setLoading] = useState(true)
  const [view,    setView]    = useState("aqi") // aqi | pm25 | daily

  useEffect(() => {
    if (!city) return
    setLoading(true)
    getHistory(city, days).then(d => {
      setData(d)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [city, days])

  const dayOptions = [
    { label:"3D", value:3 },
    { label:"7D", value:7 },
    { label:"14D", value:14 },
    { label:"30D", value:30 },
  ]

  const viewOptions = [
    { label:"AQI Trend",    value:"aqi"   },
    { label:"PM2.5",        value:"pm25"  },
    { label:"Daily Avg",    value:"daily" },
  ]

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:200, gap:10 }}>
      <motion.div
        animate={{ rotate:360 }}
        transition={{ duration:1.5, repeat:Infinity, ease:"linear" }}
        style={{ width:20, height:20, borderRadius:"50%",
          border:"2px solid #1f2937", borderTopColor:"#3b82f6" }}/>
      <span style={{ fontSize:12, color:"#6b7280" }}>Loading history...</span>
    </div>
  )

  if (!data) return null

  const chartData = view === "daily"
    ? data.daily_avg.map(d => ({ date:d.date, aqi:d.aqi_avg, label:d.aqi_label, color:d.color }))
    : data.history.map(d => ({ date:d.time, aqi:d.aqi_level, pm25:d.pm2_5, no2:d.no2 }))

  // compute stats
  const aqiValues  = data.history.map(d => d.aqi_level)
  const avgAQI     = aqiValues.length ? (aqiValues.reduce((a,b)=>a+b,0)/aqiValues.length).toFixed(1) : "-"
  const maxAQI     = aqiValues.length ? Math.max(...aqiValues) : "-"
  const minAQI     = aqiValues.length ? Math.min(...aqiValues) : "-"
  const worstDay   = data.daily_avg.reduce((a,b) => a.aqi_avg > b.aqi_avg ? a : b, data.daily_avg[0])
  const bestDay    = data.daily_avg.reduce((a,b) => a.aqi_avg < b.aqi_avg ? a : b, data.daily_avg[0])

  return (
    <motion.div
      initial={{ opacity:0, y:12 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:0.4 }}>

      {/* Controls */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:8 }}>

        {/* View toggle */}
        <div style={{ display:"flex", gap:4 }}>
          {viewOptions.map(v => (
            <button key={v.value}
              onClick={() => setView(v.value)}
              style={{
                background: view===v.value ? "#1d4ed8" : "rgba(31,41,55,0.5)",
                border:`1px solid ${view===v.value ? "#3b82f6" : "#374151"}`,
                color: view===v.value ? "#fff" : "#6b7280",
                borderRadius:6, padding:"4px 10px",
                fontSize:10, cursor:"pointer",
                fontFamily:"Inter, sans-serif"
              }}>{v.label}</button>
          ))}
        </div>

        {/* Day range */}
        <div style={{ display:"flex", gap:4 }}>
          {dayOptions.map(d => (
            <button key={d.value}
              onClick={() => setDays(d.value)}
              style={{
                background: days===d.value ? "#374151" : "transparent",
                border:`1px solid ${days===d.value ? "#6b7280" : "#1f2937"}`,
                color: days===d.value ? "#f9fafb" : "#4b5563",
                borderRadius:6, padding:"4px 10px",
                fontSize:10, cursor:"pointer",
                fontFamily:"'JetBrains Mono',monospace"
              }}>{d.label}</button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:14 }}>
        {[
          ["Avg AQI",    avgAQI,            "#3b82f6"],
          ["Worst",      maxAQI+"/5",        "#ef4444"],
          ["Best",       minAQI+"/5",        "#00e400"],
          ["Worst Day",  worstDay?.date||"-", "#f59e0b"],
        ].map(([label,val,color]) => (
          <motion.div key={label}
            initial={{ opacity:0, scale:0.9 }}
            animate={{ opacity:1, scale:1 }}
            style={{
              background:"rgba(17,24,39,0.6)",
              border:"1px solid #1f2937",
              borderRadius:8, padding:"8px 10px", textAlign:"center"
            }}>
            <div style={{ fontSize:14, fontWeight:700, color,
              fontFamily:"'JetBrains Mono',monospace" }}>{val}</div>
            <div style={{ fontSize:9, color:"#4b5563", marginTop:2 }}>{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      {view === "daily" ? (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top:4, right:4, left:-20, bottom:0 }}>
            <XAxis dataKey="date" tick={{ fontSize:9, fill:"#374151" }} />
            <YAxis domain={[0,5]} ticks={[1,2,3,4,5]}
              tick={{ fontSize:9, fill:"#374151" }}
              tickFormatter={v => ["","G","F","M","P","VP"][v]||""} />
            <Tooltip contentStyle={{
              background:"#0d1117", border:"1px solid #3b82f630",
              borderRadius:10, fontSize:11
            }} formatter={(v) => [`AQI ${v}`, "Daily Avg"]}/>
            <ReferenceLine y={3} stroke="#ff7e0050" strokeDasharray="3 3" />
            <Bar dataKey="aqi" radius={[4,4,0,0]}
              isAnimationActive animationDuration={600}>
              {chartData.map((d,i) => (
                <Cell key={i} fill={d.color || "#3b82f6"}
                  style={{ filter:`drop-shadow(0 0 4px ${d.color||"#3b82f6"}60)` }}/>
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData} margin={{ top:4, right:4, left:-20, bottom:0 }}>
            <defs>
              <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="pm25Grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize:9, fill:"#374151" }} />
            <YAxis tick={{ fontSize:9, fill:"#374151" }}
              domain={view==="aqi" ? [1,5] : [0,"auto"]}
              tickFormatter={view==="aqi" ? v => ["","G","F","M","P","VP"][v]||"" : undefined}/>
            <Tooltip content={view==="aqi" ? <CustomTooltip/> : undefined}
              contentStyle={{
                background:"#0d1117", border:"1px solid #3b82f630",
                borderRadius:10, fontSize:11
              }}/>
            <ReferenceLine y={3} stroke="#ff7e0040" strokeDasharray="3 3" label={{ value:"Moderate", fill:"#4b5563", fontSize:9 }}/>
            <Area
              type="monotone"
              dataKey={view==="aqi" ? "aqi" : "pm25"}
              stroke={view==="aqi" ? "#3b82f6" : "#f59e0b"}
              strokeWidth={2}
              fill={view==="aqi" ? "url(#histGrad)" : "url(#pm25Grad)"}
              dot={false}
              isAnimationActive animationDuration={800}/>
          </AreaChart>
        </ResponsiveContainer>
      )}

      {/* Best vs Worst */}
      <div style={{ display:"flex", gap:8, marginTop:12 }}>
        <div style={{
          flex:1, background:"rgba(0,228,0,0.06)",
          border:"1px solid #00e40025",
          borderRadius:8, padding:"8px 12px"
        }}>
          <div style={{ fontSize:9, color:"#4b5563", marginBottom:3 }}>✅ BEST DAY</div>
          <div style={{ fontSize:13, fontWeight:600, color:"#00e400" }}>{bestDay?.date}</div>
          <div style={{ fontSize:10, color:"#6b7280" }}>Avg AQI {bestDay?.aqi_avg} · {bestDay?.aqi_label}</div>
        </div>
        <div style={{
          flex:1, background:"rgba(239,68,68,0.06)",
          border:"1px solid #ef444425",
          borderRadius:8, padding:"8px 12px"
        }}>
          <div style={{ fontSize:9, color:"#4b5563", marginBottom:3 }}>⚠️ WORST DAY</div>
          <div style={{ fontSize:13, fontWeight:600, color:"#ef4444" }}>{worstDay?.date}</div>
          <div style={{ fontSize:10, color:"#6b7280" }}>Avg AQI {worstDay?.aqi_avg} · {worstDay?.aqi_label}</div>
        </div>
      </div>
    </motion.div>
  )
}