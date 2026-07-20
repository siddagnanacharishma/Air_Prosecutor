import { motion } from "framer-motion"
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from "recharts"

export default function PollutantBars({ aqi }) {
  if (!aqi) return null
  const data = [
    { name:"PM2.5", value:aqi.pm2_5, safe:25,  unit:"µg/m³" },
    { name:"PM10",  value:aqi.pm10,  safe:50,  unit:"µg/m³" },
    { name:"NO2",   value:aqi.no2,   safe:40,  unit:"µg/m³" },
    { name:"O3",    value:aqi.o3,    safe:100, unit:"µg/m³" },
    { name:"CO",    value:aqi.co,    safe:400, unit:"µg/m³" },
  ]

  return (
    <motion.div
      initial={{ opacity:0, y:10 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:0.4 }}>

      {/* Bar chart */}
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top:8, right:4, left:-20, bottom:0 }}>
          <XAxis dataKey="name" tick={{ fontSize:11, fill:"#6b7280", fontFamily:"Inter" }} />
          <YAxis tick={{ fontSize:9, fill:"#374151" }} />
          <Tooltip
            contentStyle={{
              background:"#0d1117", border:"1px solid #3b82f630",
              borderRadius:10, fontSize:11,
              boxShadow:"0 8px 32px #00000060"
            }}
            formatter={(v, n, p) => [`${v} ${p.payload.unit}`, `Safe: ${p.payload.safe}`]}
          />
          <Bar dataKey="value" radius={[6,6,0,0]}
            isAnimationActive animationDuration={800} animationEasing="ease-out">
            {data.map((d,i) => (
              <Cell key={i}
                fill={d.value > d.safe ? "#ef4444" : "#3b82f6"}
                style={{ filter: d.value > d.safe
                  ? "drop-shadow(0 0 6px #ef444480)"
                  : "drop-shadow(0 0 6px #3b82f680)" }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Progress bars */}
      <div style={{ display:"flex", flexDirection:"column", gap:6, marginTop:8 }}>
        {data.map((d,i) => {
          const pct     = Math.min((d.value/d.safe)*100, 100)
          const over    = d.value > d.safe
          const barColor= over ? "#ef4444" : "#3b82f6"
          return (
            <div key={i}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                <span style={{ fontSize:10, color:"#6b7280" }}>{d.name}</span>
                <span style={{ fontSize:10, color: over ? "#ef4444" : "#9ca3af",
                  fontFamily:"'JetBrains Mono',monospace" }}>
                  {d.value} / {d.safe} {d.unit}
                  {over && " ⚠️"}
                </span>
              </div>
              <div style={{ height:4, background:"#1f2937", borderRadius:4, overflow:"hidden" }}>
                <motion.div
                  initial={{ width:0 }}
                  animate={{ width:`${pct}%` }}
                  transition={{ duration:0.8, delay:i*0.1, ease:"easeOut" }}
                  style={{
                    height:"100%", borderRadius:4,
                    background:`linear-gradient(90deg, ${barColor}88, ${barColor})`,
                    boxShadow:`0 0 8px ${barColor}60`
                  }}/>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display:"flex", gap:16, fontSize:10, color:"#6b7280",
        justifyContent:"center", marginTop:10 }}>
        <span><span style={{ color:"#3b82f6" }}>■</span> Within safe limit</span>
        <span><span style={{ color:"#ef4444" }}>■</span> Above safe limit</span>
      </div>
    </motion.div>
  )
}