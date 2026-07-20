import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"

const AQI_COLORS = { 1:"#00e400", 2:"#ffff00", 3:"#ff7e00", 4:"#ff0000", 5:"#8f3f97" }
const AQI_LABELS = { 1:"Good", 2:"Fair", 3:"Moderate", 4:"Poor", 5:"Very Poor" }

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let start = 0
    const end  = value
    const dur  = 800
    const step = 16
    const inc  = (end - start) / (dur / step)
    const timer = setInterval(() => {
      start += inc
      if (start >= end) { setDisplay(end); clearInterval(timer) }
      else setDisplay(Math.floor(start))
    }, step)
    return () => clearInterval(timer)
  }, [value])
  return <>{display}</>
}

export default function AQIGauge({ level }) {
  const color = AQI_COLORS[level] || "#888"
  const pct   = ((level-1)/4)*100
  const data  = [{ value:pct }, { value:100-pct }]

  return (
    <div style={{ textAlign:"center", position:"relative", height:120 }}>
      {/* Glow ring behind gauge */}
      <div style={{
        position:"absolute", top:"50%", left:"50%",
        transform:"translate(-50%,-60%)",
        width:120, height:120, borderRadius:"50%",
        background:`radial-gradient(circle, ${color}15 0%, transparent 70%)`,
        pointerEvents:"none"
      }}/>

      <ResponsiveContainer width="100%" height={120}>
        <PieChart>
          <Pie data={data} cx="50%" cy="88%"
            startAngle={180} endAngle={0}
            innerRadius={52} outerRadius={72}
            dataKey="value" paddingAngle={2}
            isAnimationActive={true}
            animationBegin={0}
            animationDuration={1000}
            animationEasing="ease-out">
            <Cell fill={color} style={{ filter:`drop-shadow(0 0 8px ${color})` }} />
            <Cell fill="#1f2937" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <div style={{
        position:"absolute", bottom:4, left:"50%",
        transform:"translateX(-50%)", textAlign:"center"
      }}>
        <motion.div
          initial={{ scale:0 }} animate={{ scale:1 }}
          transition={{ type:"spring", delay:0.3 }}
          style={{ fontSize:26, fontWeight:700, color,
            textShadow:`0 0 20px ${color}` }}>
          <AnimatedNumber value={level} />/5
        </motion.div>
        <div style={{ fontSize:11, color:"#9ca3af", marginTop:1 }}>
          {AQI_LABELS[level]}
        </div>
      </div>
    </div>
  )
}