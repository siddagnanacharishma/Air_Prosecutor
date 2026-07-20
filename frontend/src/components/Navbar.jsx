import { NavLink, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"

const links = [
  { to:"/",         label:"Dashboard",   short:"MAP"     },
  { to:"/enforce",  label:"Enforcement",  short:"ENFORCE" },
  { to:"/alerts",   label:"Alerts",       short:"ALERTS"  },
]

function ParticleBar() {
  const [particles, setParticles] = useState([])
  useEffect(() => {
    setParticles(Array.from({ length:12 }, (_,i) => ({
      id:i, x:Math.random()*100, delay:Math.random()*3,
      duration:2+Math.random()*3, size:1+Math.random()*2
    })))
  }, [])
  return (
    <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none" }}>
      {particles.map(p => (
        <motion.div key={p.id}
          animate={{ y:[-4,4,-4], opacity:[0.3,0.8,0.3] }}
          transition={{ duration:p.duration, repeat:Infinity, delay:p.delay }}
          style={{
            position:"absolute", left:`${p.x}%`, top:"50%",
            width:p.size, height:p.size, borderRadius:"50%",
            background:"#3b82f6", boxShadow:"0 0 4px #3b82f6"
          }}/>
      ))}
    </div>
  )
}

export default function Navbar() {
  const location  = useLocation()
  const [time, setTime] = useState(new Date())
  const [hovered, setHovered] = useState(null)

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const activeLink = links.find(l =>
    l.to==="/" ? location.pathname==="/" : location.pathname.startsWith(l.to)
  )

  return (
    <motion.nav
      initial={{ y:-80 }}
      animate={{ y:0 }}
      transition={{ duration:0.6, ease:[0.16,1,0.3,1] }}
      style={{
        position:"relative", zIndex:200, height:60,
        background:"linear-gradient(180deg,rgba(3,5,12,0.98) 0%,rgba(5,8,20,0.95) 100%)",
        borderBottom:"1px solid transparent",
        backgroundClip:"padding-box",
        display:"flex", alignItems:"center",
        padding:"0 20px", gap:0,
        overflow:"hidden"
      }}>

      {/* Animated border bottom */}
      <motion.div
        animate={{ backgroundPosition:["0% 0%","200% 0%"] }}
        transition={{ duration:4, repeat:Infinity, ease:"linear" }}
        style={{
          position:"absolute", bottom:0, left:0, right:0, height:1,
          background:"linear-gradient(90deg,transparent 0%,#3b82f6 20%,#60a5fa 40%,#3b82f6 60%,transparent 80%)",
          backgroundSize:"200% 100%"
        }}/>

      {/* Scan line */}
      <motion.div
        animate={{ x:["-100%","200%"] }}
        transition={{ duration:6, repeat:Infinity, ease:"linear", repeatDelay:4 }}
        style={{
          position:"absolute", top:0, bottom:0, width:"30%",
          background:"linear-gradient(90deg,transparent,rgba(59,130,246,0.04),transparent)",
          pointerEvents:"none"
        }}/>

      <ParticleBar />

      {/* Logo */}
      <motion.div
        whileHover={{ scale:1.02 }}
        style={{ display:"flex", alignItems:"center", gap:0, marginRight:32, cursor:"pointer" }}>

        {/* Icon block */}
        <motion.div
          animate={{ boxShadow:[
            "0 0 12px #3b82f640",
            "0 0 24px #3b82f680",
            "0 0 12px #3b82f640"
          ]}}
          transition={{ duration:2.5, repeat:Infinity }}
          style={{
            width:38, height:38, borderRadius:"10px",
            background:"linear-gradient(135deg,#0f2460,#1d4ed8,#3b82f6)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:18, marginRight:10,
            border:"1px solid #3b82f640"
          }}>⚖️</motion.div>

        <div>
          <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
            <span style={{
              fontSize:16, fontWeight:800, color:"#f9fafb",
              letterSpacing:"-0.03em",
              background:"linear-gradient(135deg,#f9fafb,#93c5fd)",
              WebkitBackgroundClip:"text",
              WebkitTextFillColor:"transparent"
            }}>Air</span>
            <span style={{
              fontSize:16, fontWeight:800,
              letterSpacing:"-0.03em",
              background:"linear-gradient(135deg,#3b82f6,#60a5fa)",
              WebkitBackgroundClip:"text",
              WebkitTextFillColor:"transparent"
            }}>Prosecutor</span>
          </div>
          <div style={{ fontSize:8, color:"#1d4ed8", letterSpacing:"0.18em",
            fontFamily:"'JetBrains Mono',monospace", marginTop:-1 }}>
            INDIA · AIR INTELLIGENCE
          </div>
        </div>
      </motion.div>

      {/* Divider */}
      <div style={{ width:1, height:28, background:"#1f2937", marginRight:24 }}/>

      {/* Nav links */}
      <div style={{ display:"flex", gap:4, flex:1 }}>
        {links.map((l,i) => {
          const isActive = l.to==="/"
            ? location.pathname==="/"
            : location.pathname.startsWith(l.to)
          const isHovered = hovered === l.to

          return (
            <NavLink key={l.to} to={l.to} end={l.to==="/"}>
              <motion.div
                onHoverStart={() => setHovered(l.to)}
                onHoverEnd={() => setHovered(null)}
                initial={{ opacity:0, y:-8 }}
                animate={{ opacity:1, y:0 }}
                transition={{ delay:i*0.07+0.3 }}
                whileTap={{ scale:0.95 }}
                style={{
                  position:"relative",
                  display:"flex", alignItems:"center", gap:7,
                  padding:"7px 16px", borderRadius:10, fontSize:12,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "#f9fafb" : "#4b5563",
                  background: isActive
                    ? "linear-gradient(135deg,rgba(29,78,216,0.5),rgba(59,130,246,0.3))"
                    : isHovered ? "rgba(59,130,246,0.08)" : "transparent",
                  border: isActive
                    ? "1px solid #3b82f660"
                    : isHovered ? "1px solid #3b82f620" : "1px solid transparent",
                  transition:"all 0.2s ease",
                  cursor:"pointer",
                  overflow:"hidden"
                }}>

                {/* Active glow */}
                {isActive && (
                  <motion.div
                    layoutId="navGlow"
                    style={{
                      position:"absolute", inset:0, borderRadius:10,
                      background:"linear-gradient(135deg,#1d4ed820,#3b82f610)",
                      boxShadow:"inset 0 0 20px #3b82f615"
                    }}/>
                )}

                <span style={{ fontSize:13, position:"relative" }}>{l.icon}</span>
                <span style={{ position:"relative", letterSpacing:"0.01em" }}>{l.label}</span>

                {isActive && (
                  <motion.div
                    layoutId="activeDot"
                    style={{
                      width:4, height:4, borderRadius:"50%",
                      background:"#60a5fa",
                      boxShadow:"0 0 8px #60a5fa",
                      position:"relative"
                    }}/>
                )}
              </motion.div>
            </NavLink>
          )
        })}
      </div>

      {/* Right section */}
      <div style={{ display:"flex", alignItems:"center", gap:16 }}>

        {/* Current page indicator */}
        <AnimatePresence mode="wait">
          <motion.div key={activeLink?.label}
            initial={{ opacity:0, y:4 }}
            animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:-4 }}
            style={{
              fontSize:10, color:"#1d4ed8",
              fontFamily:"'JetBrains Mono',monospace",
              letterSpacing:"0.1em"
            }}>
            /{activeLink?.short||"HOME"}
          </motion.div>
        </AnimatePresence>

        {/* Divider */}
        <div style={{ width:1, height:24, background:"#1f2937" }}/>

        {/* Live clock */}
        <div style={{ textAlign:"right" }}>
          <motion.div
            key={time.getSeconds()}
            initial={{ opacity:0.6 }}
            animate={{ opacity:1 }}
            style={{
              fontSize:13, fontWeight:600, color:"#e2e8f0",
              fontFamily:"'JetBrains Mono',monospace",
              letterSpacing:"0.04em"
            }}>
            {time.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit", second:"2-digit" })}
          </motion.div>
          <div style={{ fontSize:9, color:"#374151", letterSpacing:"0.05em" }}>
            {time.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" })}
          </div>
        </div>

        {/* Live indicator */}
        <motion.div
          style={{ display:"flex", alignItems:"center", gap:5,
            background:"rgba(0,228,0,0.06)",
            border:"1px solid rgba(0,228,0,0.2)",
            borderRadius:20, padding:"4px 10px"
          }}>
          <motion.div
            animate={{ scale:[1,1.5,1], opacity:[1,0.4,1] }}
            transition={{ duration:1.5, repeat:Infinity }}
            style={{ width:5, height:5, borderRadius:"50%",
              background:"#00e400", boxShadow:"0 0 8px #00e400" }}/>
          <span style={{ fontSize:9, color:"#00e400",
            fontFamily:"'JetBrains Mono',monospace", letterSpacing:"0.08em" }}>
            LIVE
          </span>
        </motion.div>
      </div>
    </motion.nav>
  )
}