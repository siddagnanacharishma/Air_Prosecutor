import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { analyzeCity, getForecast, AQI_COLORS } from "../api"
import AQIGauge      from "../components/AQIGauge"
import PollutantBars from "../components/PollutantBars"
import SourceChart   from "../components/SourceChart"
import HistoryChart  from "../components/HistoryChart"
import PDFReport from "../components/PDFReport"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"


const riskColor = { LOW:"#00e400", MEDIUM:"#ffff00", HIGH:"#ff7e00", CRITICAL:"#ff0000" }

const LANG_FLAGS = {
  Hindi:"🇮🇳", Marathi:"🟠", Bengali:"🟡", Tamil:"🔵",
  Telugu:"🟢", Kannada:"🟣", Malayalam:"🔴", Gujarati:"🟤",
  Punjabi:"🟡", Odia:"🔵", Assamese:"🟢"
}

function InfoCard({ title, children, delay=0, accent=false, warning=false }) {
  return (
    <motion.div
      initial={{ opacity:0, y:14 }}
      animate={{ opacity:1, y:0 }}
      transition={{ delay, duration:0.45, ease:[0.16,1,0.3,1] }}
      style={{
        background: warning ? "rgba(26,10,0,0.85)" : "rgba(13,17,23,0.85)",
        backdropFilter:"blur(20px)",
        border:`1px solid ${warning ? "#92400e" : accent ? "#3b82f630" : "#1f2937"}`,
        borderRadius:14, padding:16,
        boxShadow: accent ? "0 0 24px #3b82f612" : warning ? "0 0 20px #f59e0b08" : "none"
      }}>
      <div style={{ fontSize:9, color: warning ? "#f59e0b" : "#4b5563",
        letterSpacing:"0.07em", marginBottom:10 }}>{title}</div>
      {children}
    </motion.div>
  )
}

export default function CityDetail() {
  const { city }  = useParams()
  const navigate  = useNavigate()
  const [data,     setData]     = useState(null)
  const [forecast, setForecast] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    setLoading(true)
    setData(null)
    Promise.all([analyzeCity(city), getForecast(city)]).then(([a, f]) => {
      setData(a)
      setForecast(f.next_24hrs.map(x => ({
        time: x.time.split(" ").slice(1).join(" "),
        aqi:  x.aqi_level, pm25: x.pm2_5
      })))
      setLoading(false)
    })
  }, [city])

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
      height:"calc(100vh - 56px)", flexDirection:"column", gap:16 }}>
      <motion.div
        animate={{ rotate:360 }}
        transition={{ duration:2, repeat:Infinity, ease:"linear" }}
        style={{ width:44, height:44, borderRadius:"50%",
          border:"3px solid #1f2937", borderTopColor:"#3b82f6",
          boxShadow:"0 0 20px #3b82f640" }}/>
      <motion.p animate={{ opacity:[0.4,1,0.4] }}
        transition={{ duration:2, repeat:Infinity }}
        style={{ color:"#6b7280", fontSize:13 }}>
        Prosecuting {city}'s air...
      </motion.p>
    </div>
  )

  if (!data || data.error) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
      height:"calc(100vh - 56px)", color:"#6b7280", flexDirection:"column", gap:12 }}>
      <div style={{ fontSize:32 }}>❌</div>
      <p>City not found</p>
      <button onClick={() => navigate("/")} style={{
        background:"#1d4ed8", border:"none", color:"#fff",
        borderRadius:8, padding:"8px 18px", cursor:"pointer", fontSize:12
      }}>← Back to Dashboard</button>
    </div>
  )

  const a     = data.ai_analysis
  const color = AQI_COLORS[data.aqi.level]
  const lang  = data.language || "Hindi"

  return (
    <motion.div className="page-enter"
      style={{ padding:18, overflowY:"auto", height:"calc(100vh - 56px)" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
        <motion.button
          onClick={() => navigate("/")}
          whileHover={{ scale:1.04, x:-2 }}
          whileTap={{ scale:0.96 }}
          style={{
            background:"rgba(13,17,23,0.8)", border:"1px solid #1f2937",
            color:"#9ca3af", borderRadius:10, padding:"7px 14px",
            cursor:"pointer", fontSize:12, backdropFilter:"blur(10px)"
          }}>← Back</motion.button>

        <div>
          <h1 style={{ fontSize:20, fontWeight:700, color:"#f9fafb", letterSpacing:"-0.02em" }}>
            {data.city}
            <span style={{ color:"#374151", fontWeight:400, fontSize:15 }}> / Air Analysis</span>
          </h1>
          <div style={{ display:"flex", gap:8, alignItems:"center", marginTop:2 }}>
            {data.state && <span style={{ fontSize:11, color:"#4b5563" }}>{data.state}</span>}
            {data.state && <span style={{ color:"#1f2937" }}>·</span>}
            <span style={{ fontSize:11, color:"#3b82f6" }}>
              {LANG_FLAGS[lang]||"🌐"} Advisory in {lang}
            </span>
          </div>
        </div>
              <PDFReport data={data} />
        <motion.div
          animate={{ boxShadow:[`0 0 8px ${color}30`,`0 0 20px ${color}60`,`0 0 8px ${color}30`] }}
          transition={{ duration:2, repeat:Infinity }}
          style={{
            marginLeft:"auto",
            background:`${color}15`, border:`1px solid ${color}50`,
            borderRadius:10, padding:"9px 18px", textAlign:"center"
          }}>
          <div style={{ fontSize:15, fontWeight:700, color,
            textShadow:`0 0 14px ${color}` }}>{data.aqi.label}</div>
          <div style={{ fontSize:9, color:"#4b5563" }}>Current AQI</div>
        </motion.div>
      </div>

      {/* Row 1 — gauge + weather + verdict */}
      <div style={{ display:"grid", gridTemplateColumns:"185px 1fr 1fr", gap:12, marginBottom:12 }}>
        <InfoCard title="📊 AQI GAUGE" delay={0.08} accent>
          <AQIGauge level={data.aqi.level} />
        </InfoCard>

        <InfoCard title="🌤️ WEATHER CONTEXT" delay={0.12}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {[
              ["🌡️","Temperature",`${data.weather.temp}°C`],
              ["💨","Wind Speed", `${data.weather.wind_speed} m/s`],
              ["🧭","Direction",  data.weather.wind_direction],
              ["💧","Humidity",   `${data.weather.humidity}%`],
            ].map(([icon,label,val],i) => (
              <motion.div key={label}
                initial={{ opacity:0, scale:0.92 }}
                animate={{ opacity:1, scale:1 }}
                transition={{ delay:0.15+i*0.05 }}
                style={{
                  background:"rgba(31,41,55,0.5)",
                  border:"1px solid #374151", borderRadius:9, padding:"9px 11px"
                }}>
                <div style={{ fontSize:9, color:"#4b5563" }}>{icon} {label}</div>
                <div style={{ fontSize:14, fontWeight:600, color:"#f3f4f6", marginTop:3,
                  fontFamily:"'JetBrains Mono',monospace" }}>{val}</div>
              </motion.div>
            ))}
          </div>
        </InfoCard>

        <InfoCard title="⚖️ AI VERDICT" delay={0.16}>
          <p style={{ fontSize:13, lineHeight:1.8, color:"#e2e8f0" }}>{a.verdict}</p>
          <div style={{ marginTop:10, display:"flex", gap:8, alignItems:"center" }}>
            <span style={{ fontSize:9, color:"#4b5563" }}>RISK</span>
            <motion.span
              animate={{ boxShadow:[
                `0 0 6px ${riskColor[a.risk_level]}40`,
                `0 0 14px ${riskColor[a.risk_level]}80`,
                `0 0 6px ${riskColor[a.risk_level]}40`
              ]}}
              transition={{ duration:2, repeat:Infinity }}
              style={{
                background:`${riskColor[a.risk_level]}20`,
                border:`1px solid ${riskColor[a.risk_level]}`,
                color:riskColor[a.risk_level],
                borderRadius:20, padding:"2px 12px",
                fontSize:10, fontWeight:700
              }}>{a.risk_level}</motion.span>
          </div>
        </InfoCard>
      </div>

      {/* Row 2 — pollutants + sources */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
        <InfoCard title="🧪 POLLUTANT LEVELS — red = above WHO safe limit" delay={0.2}>
          <PollutantBars aqi={data.aqi} />
        </InfoCard>
        <InfoCard title="🏭 SOURCE ATTRIBUTION" delay={0.24}>
          <SourceChart sources={data.attribution.sources} aqi={data.aqi} />
        </InfoCard>
      </div>

      {/* Row 3 — HISTORY CHART (new!) */}
      <InfoCard title="📈 HISTORICAL AQI TREND — last 7 days" delay={0.28} accent>
        <HistoryChart city={city} />
      </InfoCard>

      {/* Row 4 — forecast + enforcement */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12, marginTop:12 }}>
        <InfoCard title="🔮 24-HOUR FORECAST" delay={0.32}>
          <ResponsiveContainer width="100%" height={148}>
            <AreaChart data={forecast}>
              <defs>
                <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
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
                stroke="#3b82f6" strokeWidth={2} fill="url(#fg)"
                isAnimationActive animationDuration={900} />
            </AreaChart>
          </ResponsiveContainer>
        </InfoCard>

        <InfoCard title="🚨 ENFORCEMENT ORDER" delay={0.36} warning>
          <p style={{ fontSize:13, color:"#fde68a", lineHeight:1.8 }}>{a.enforcement_order}</p>
          <div style={{ borderTop:"1px solid #92400e30", marginTop:12, paddingTop:12 }}>
            <div style={{ fontSize:9, color:"#f59e0b", marginBottom:8, letterSpacing:"0.06em" }}>
              📢 CITIZEN ADVISORY
              <span style={{
                marginLeft:8, background:"#1d4ed820",
                border:"1px solid #3b82f630",
                color:"#3b82f6", borderRadius:6,
                padding:"1px 7px", fontSize:9
              }}>{LANG_FLAGS[lang]||"🌐"} {lang}</span>
            </div>
            <motion.div whileHover={{ scale:1.01 }}
              style={{
                background:"rgba(45,23,0,0.6)",
                border:"1px solid #92400e40",
                borderRadius:8, padding:"10px 12px", marginBottom:8
              }}>
              <div style={{ fontSize:9, color:"#92400e", marginBottom:4 }}>{lang}</div>
              <div style={{ fontSize:13, color:"#fde68a", lineHeight:1.6 }}>
                {a.citizen_advisory_local}
              </div>
            </motion.div>
            <motion.div whileHover={{ scale:1.01 }}
              style={{
                background:"rgba(30,30,40,0.6)",
                border:"1px solid #374151",
                borderRadius:8, padding:"10px 12px"
              }}>
              <div style={{ fontSize:9, color:"#4b5563", marginBottom:4 }}>English</div>
              <div style={{ fontSize:12, color:"#9ca3af", lineHeight:1.6 }}>
                {a.citizen_advisory_english}
              </div>
            </motion.div>
          </div>
        </InfoCard>
      </div>

      {/* Row 5 — enforcement report */}
      <InfoCard title="📋 OFFICIAL ENFORCEMENT REPORT" delay={0.4}>
        <pre style={{
          fontSize:11, color:"#6b7280", whiteSpace:"pre-wrap",
          lineHeight:1.9, fontFamily:"'JetBrains Mono',monospace"
        }}>{data.enforcement_report}</pre>
      </InfoCard>
    </motion.div>
  )
}