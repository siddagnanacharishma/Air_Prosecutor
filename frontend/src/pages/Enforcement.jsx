import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { analyzeCity, AQI_COLORS, CITIES } from "../api"

const riskColor  = { LOW:"#00e400", MEDIUM:"#ffff00", HIGH:"#ff7e00", CRITICAL:"#ff0000" }
const riskOrder  = { CRITICAL:0, HIGH:1, MEDIUM:2, LOW:3 }
const LANG_FLAGS = {
  Hindi:"🇮🇳", Marathi:"🟠", Bengali:"🟡", Tamil:"🔵",
  Telugu:"🟢", Kannada:"🟣", Malayalam:"🔴", Gujarati:"🟤",
  Punjabi:"🟡", Odia:"🔵", Assamese:"🟢"
}

function CityOrderCard({ o, i, navigate }) {
  const [expanded, setExpanded] = useState(false)
  const color    = AQI_COLORS[o.aqi]
  const rc       = riskColor[o.risk]

  return (
    <motion.div
      initial={{ opacity:0, y:16 }}
      animate={{ opacity:1, y:0 }}
      transition={{ delay:i*0.06, ease:[0.16,1,0.3,1] }}
      style={{
        background:"rgba(13,17,23,0.85)",
        backdropFilter:"blur(20px)",
        border:`1px solid #1f2937`,
        borderTop:`3px solid ${rc}`,
        borderRadius:14, overflow:"hidden",
        boxShadow:`0 0 20px ${rc}08`
      }}>

      {/* Card header */}
      <div style={{ padding:"14px 16px 10px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:"#f9fafb", marginBottom:3 }}>
              {o.city}
            </div>
            <div style={{ fontSize:10, color:"#4b5563" }}>
              {o.state} · {LANG_FLAGS[o.lang]||"🌐"} {o.lang}
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:5 }}>
            <span style={{
              background:`${rc}20`, border:`1px solid ${rc}`,
              color:rc, borderRadius:20, padding:"2px 10px",
              fontSize:10, fontWeight:700
            }}>{o.risk}</span>
            <span style={{
              background:`${color}20`, border:`1px solid ${color}`,
              color, borderRadius:20, padding:"2px 10px",
              fontSize:9, fontWeight:600
            }}>{o.aqi_label}</span>
          </div>
        </div>

        {/* Primary source */}
        <div style={{
          fontSize:11, color:"#6b7280",
          background:"rgba(31,41,55,0.4)",
          borderRadius:6, padding:"5px 8px",
          marginBottom:10
        }}>
          🏭 {o.source}
        </div>

        {/* Enforcement order */}
        <div style={{
          background:"rgba(26,10,0,0.8)",
          border:"1px solid #92400e",
          borderRadius:8, padding:"9px 12px",
          marginBottom:10
        }}>
          <div style={{ fontSize:8, color:"#f59e0b", letterSpacing:"0.08em", marginBottom:4 }}>
            ENFORCEMENT ORDER
          </div>
          <p style={{ fontSize:12, color:"#fde68a", lineHeight:1.6, margin:0 }}>
            {o.order}
          </p>
        </div>

        {/* Advisory preview */}
        <div style={{
          background:"rgba(17,24,39,0.6)",
          border:"1px solid #1f2937",
          borderRadius:8, padding:"7px 10px",
          marginBottom:10, fontSize:11, color:"#9ca3af", lineHeight:1.5
        }}>
          <span style={{ color:"#4b5563", fontSize:9 }}>{o.lang} · </span>
          {o.hindi}
        </div>
      </div>

      {/* Expandable verdict */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding:"8px 16px",
          borderTop:"1px solid #1f2937",
          cursor:"pointer",
          display:"flex", justifyContent:"space-between", alignItems:"center",
          background:"rgba(31,41,55,0.2)"
        }}>
        <span style={{ fontSize:10, color:"#4b5563" }}>
          {expanded ? "Hide" : "Show"} AI verdict
        </span>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          style={{ fontSize:10, color:"#4b5563" }}>▼</motion.span>
      </div>

      <motion.div
        initial={false}
        animate={{ height: expanded ? "auto" : 0, opacity: expanded ? 1 : 0 }}
        transition={{ duration:0.25 }}
        style={{ overflow:"hidden" }}>
        <div style={{ padding:"10px 16px 14px" }}>
          <p style={{ fontSize:11, color:"#6b7280", fontStyle:"italic", lineHeight:1.7, margin:0 }}>
            "{o.verdict}"
          </p>
        </div>
      </motion.div>

      {/* Footer */}
      <div style={{
        padding:"10px 16px",
        borderTop:"1px solid #1f2937",
        display:"flex", justifyContent:"space-between", alignItems:"center",
        background:"rgba(5,8,16,0.4)"
      }}>
        <div style={{ display:"flex", gap:10 }}>
          {[["PM2.5",o.pm2_5],["AQI",o.aqi+"/5"]].map(([k,v]) => (
            <div key={k} style={{ textAlign:"center" }}>
              <div style={{ fontSize:13, fontWeight:700, color,
                fontFamily:"'JetBrains Mono',monospace" }}>{v}</div>
              <div style={{ fontSize:8, color:"#4b5563" }}>{k}</div>
            </div>
          ))}
        </div>
        <motion.button
          onClick={() => navigate(`/city/${o.city.toLowerCase()}`)}
          whileHover={{ scale:1.05 }}
          whileTap={{ scale:0.96 }}
          style={{
            background:"linear-gradient(135deg,#1d4ed8,#3b82f6)",
            border:"none", color:"#fff", borderRadius:8,
            padding:"6px 14px", cursor:"pointer", fontSize:11,
            fontWeight:600, boxShadow:"0 0 12px #3b82f630"
          }}>Full Analysis →</motion.button>
      </div>
    </motion.div>
  )
}

export default function Enforcement() {
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState("ALL")
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all(CITIES.map(c => analyzeCity(c))).then(results => {
      setOrders(results
        .filter(r => !r.error)
        .map(r => ({
          city:      r.city,
          state:     r.state || "",
          lang:      r.language || "Hindi",
          risk:      r.ai_analysis.risk_level,
          order:     r.ai_analysis.enforcement_order,
          source:    r.ai_analysis.primary_source,
          verdict:   r.ai_analysis.verdict,
          hindi:     r.ai_analysis.citizen_advisory_local,
          aqi:       r.aqi.level,
          aqi_label: r.aqi.label,
          pm2_5:     r.aqi.pm2_5,
        }))
        .sort((a,b) => (riskOrder[a.risk]??9) - (riskOrder[b.risk]??9))
      )
      setLoading(false)
    })
  }, [])

  const filterOptions = ["ALL","CRITICAL","HIGH","MEDIUM","LOW"]

  const filtered = filter === "ALL"
    ? orders
    : orders.filter(o => o.risk === filter)

  const counts = {}
  filterOptions.slice(1).forEach(r => {
    counts[r] = orders.filter(o => o.risk === r).length
  })

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
      height:"calc(100vh - 56px)", flexDirection:"column", gap:16 }}>
      <motion.div
        animate={{ rotate:360 }}
        transition={{ duration:2, repeat:Infinity, ease:"linear" }}
        style={{ width:48, height:48, borderRadius:"50%",
          border:"3px solid #1f2937", borderTopColor:"#ef4444",
          boxShadow:"0 0 20px #ef444440" }}/>
      <motion.p animate={{ opacity:[0.4,1,0.4] }}
        transition={{ duration:2, repeat:Infinity }}
        style={{ color:"#6b7280", fontSize:13 }}>
        Generating enforcement orders for all cities...
      </motion.p>
    </div>
  )

  return (
    <motion.div className="page-enter"
      style={{ padding:24, overflowY:"auto", height:"calc(100vh - 56px)" }}>

      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <h2 style={{ fontSize:22, fontWeight:700, color:"#f9fafb", letterSpacing:"-0.02em" }}>
          🚨 Enforcement Command Center
        </h2>
        <p style={{ fontSize:12, color:"#4b5563", marginTop:4 }}>
          AI-generated enforcement orders · {orders.length} cities · sorted by severity
        </p>
      </div>

      {/* Summary stat cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
        {["CRITICAL","HIGH","MEDIUM","LOW"].map((r,i) => (
          <motion.div key={r}
            initial={{ opacity:0, scale:0.9 }}
            animate={{ opacity:1, scale:1 }}
            transition={{ delay:i*0.07 }}
            onClick={() => setFilter(filter===r ? "ALL" : r)}
            style={{
              background: filter===r
                ? `${riskColor[r]}20`
                : "rgba(13,17,23,0.8)",
              backdropFilter:"blur(20px)",
              border:`1px solid ${filter===r ? riskColor[r] : riskColor[r]+"25"}`,
              borderRadius:14, padding:"16px 20px",
              textAlign:"center", cursor:"pointer",
              boxShadow: filter===r ? `0 0 20px ${riskColor[r]}20` : "none",
              transition:"all 0.2s"
            }}>
            <motion.div
              animate={{ textShadow:[
                `0 0 10px ${riskColor[r]}40`,
                `0 0 24px ${riskColor[r]}80`,
                `0 0 10px ${riskColor[r]}40`
              ]}}
              transition={{ duration:2, repeat:Infinity, delay:i*0.3 }}
              style={{ fontSize:28, fontWeight:700, color:riskColor[r],
                fontFamily:"'JetBrains Mono',monospace" }}>
              {counts[r]||0}
            </motion.div>
            <div style={{ fontSize:10, color:"#4b5563", letterSpacing:"0.06em", marginTop:4 }}>{r}</div>
          </motion.div>
        ))}
      </div>

      {/* Filter pills */}
      <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
        {filterOptions.map(f => (
          <motion.button key={f}
            onClick={() => setFilter(f)}
            whileTap={{ scale:0.95 }}
            style={{
              background: filter===f
                ? f==="ALL" ? "#1d4ed8" : `${riskColor[f]}30`
                : "rgba(13,17,23,0.6)",
              border:`1px solid ${filter===f
                ? f==="ALL" ? "#3b82f6" : riskColor[f]
                : "#1f2937"}`,
              color: filter===f
                ? f==="ALL" ? "#fff" : riskColor[f]
                : "#6b7280",
              borderRadius:20, padding:"4px 14px",
              fontSize:11, cursor:"pointer",
              fontFamily:"Inter, sans-serif"
            }}>
            {f} {f!=="ALL" && `(${counts[f]||0})`}
          </motion.button>
        ))}
        <div style={{ marginLeft:"auto", fontSize:11, color:"#374151", alignSelf:"center" }}>
          {filtered.length} cities shown
        </div>
      </div>

      {/* 2-column grid */}
      <div style={{
        display:"grid",
        gridTemplateColumns:"1fr 1fr",
        gap:14
      }}>
        {filtered.map((o,i) => (
          <CityOrderCard key={o.city} o={o} i={i} navigate={navigate} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign:"center", padding:48, color:"#4b5563", fontSize:13 }}>
          No cities with {filter} risk level right now
        </div>
      )}
    </motion.div>
  )
}