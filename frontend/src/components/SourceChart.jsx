import { motion } from "framer-motion"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"

const COLORS = ["#3b82f6","#f59e0b","#10b981","#ef4444","#8b5cf6"]

function weighSources(sources) {
  const weights = sources.map(s => {
    const sl = s.toLowerCase()
    if (sl.includes("vehicle")||sl.includes("traffic")) return 35
    if (sl.includes("industrial")||sl.includes("refinery")) return 30
    if (sl.includes("burning")||sl.includes("stubble")) return 40
    if (sl.includes("construction")) return 20
    if (sl.includes("sea")||sl.includes("good")) return 5
    return 25
  })
  const total = weights.reduce((a,b) => a+b, 0)
  return sources.map((s,i) => ({
    name:  s.length>35 ? s.slice(0,35)+"…" : s,
    full:  s,
    value: Math.round((weights[i]/total)*100)
  })).sort((a,b) => b.value-a.value)
}

export default function SourceChart({ sources }) {
  if (!sources||sources.length===0) return null
  const data = weighSources(sources)

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.5 }}>
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%"
            outerRadius={65} innerRadius={30}
            dataKey="value" paddingAngle={4}
            isAnimationActive animationDuration={800}>
            {data.map((_,i) => (
              <Cell key={i} fill={COLORS[i%COLORS.length]}
                style={{ filter:`drop-shadow(0 0 6px ${COLORS[i%COLORS.length]}80)` }}/>
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background:"#0d1117", border:"1px solid #3b82f630",
              borderRadius:10, fontSize:11
            }}
            formatter={(v,n,p) => [`${v}% contribution`, p.payload.full]}
          />
        </PieChart>
      </ResponsiveContainer>

      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {data.map((d,i) => (
          <motion.div key={i}
            initial={{ opacity:0, x:-10 }}
            animate={{ opacity:1, x:0 }}
            transition={{ delay:i*0.08+0.3 }}
            style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{
              width:8, height:8, borderRadius:"50%", flexShrink:0,
              background:COLORS[i%COLORS.length],
              boxShadow:`0 0 6px ${COLORS[i%COLORS.length]}`
            }}/>
            <div style={{ flex:1, fontSize:11, color:"#9ca3af" }}>{d.full}</div>
            <motion.div
              initial={{ scale:0 }} animate={{ scale:1 }}
              transition={{ delay:i*0.08+0.5, type:"spring" }}
              style={{
                fontSize:11, fontWeight:600,
                color:COLORS[i%COLORS.length],
                fontFamily:"'JetBrains Mono',monospace"
              }}>{d.value}%</motion.div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}