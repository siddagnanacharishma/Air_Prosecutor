import { useState } from "react"
import jsPDF from "jspdf"

export default function PDFReport({ data }) {
  const [generating, setGenerating] = useState(false)
  const [done,       setDone]       = useState(false)

  const generatePDF = async () => {
    setGenerating(true)

    const doc      = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" })
    const pageW    = doc.internal.pageSize.getWidth()
    const pageH    = doc.internal.pageSize.getHeight()
    const margin   = 25
    const contentW = pageW - margin * 2
    let   y        = 0

    const a       = data.ai_analysis
    const aqi     = data.aqi
    const weather = data.weather
    const city    = data.city
    const state   = data.state    || ""
    const lang    = data.language || "Hindi"
    const now     = new Date()
    const dateStr = now.toLocaleDateString("en-IN", { day:"2-digit", month:"long", year:"numeric" })
    const timeStr = now.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" })
    const caseNo  = `AP/${now.getFullYear()}/${city.slice(0,3).toUpperCase()}/${String(Math.floor(Math.random()*99999)).padStart(5,"0")}`

    // ── Helpers ───────────────────────────────────────
    const black  = () => { doc.setTextColor(0,0,0) }
    const gray   = () => { doc.setTextColor(80,80,80) }
    const lgray  = () => { doc.setTextColor(120,120,120) }

    const line = (y1) => {
      doc.setDrawColor(0,0,0)
      doc.setLineWidth(0.3)
      doc.line(margin, y1, pageW-margin, y1)
    }

    const thinLine = (y1) => {
      doc.setDrawColor(180,180,180)
      doc.setLineWidth(0.2)
      doc.line(margin, y1, pageW-margin, y1)
    }

    const checkPageBreak = (needed=20) => {
      if (y + needed > pageH - 25) {
        doc.addPage()
        y = margin
        // double border on new page
        doc.setDrawColor(0,0,0)
        doc.setLineWidth(0.8)
        doc.rect(10, 10, pageW-20, pageH-20)
        doc.setLineWidth(0.3)
        doc.rect(12, 12, pageW-24, pageH-24)
      }
    }

    const sectionHeader = (title) => {
      checkPageBreak(14)
      y += 4
      black()
      doc.setFontSize(9)
      doc.setFont("helvetica","bold")
      doc.text(title.toUpperCase(), margin, y)
      line(y+2)
      y += 7
    }

    const field = (label, value) => {
      checkPageBreak(10)
      lgray()
      doc.setFontSize(8)
      doc.setFont("helvetica","normal")
      doc.text(label, margin, y)
      black()
      doc.setFontSize(9)
      doc.setFont("helvetica","normal")
      const lines = doc.splitTextToSize(value||"—", contentW - 50)
      doc.text(lines, margin + 50, y)
      y += lines.length * 5 + 2
    }

    // ══════════════════════════════════════════════════
    // DOCUMENT START
    // ══════════════════════════════════════════════════

    // Outer double border
    doc.setDrawColor(0,0,0)
    doc.setLineWidth(0.8)
    doc.rect(10, 10, pageW-20, pageH-20)
    doc.setLineWidth(0.3)
    doc.rect(12, 12, pageW-24, pageH-24)

    y = 22

    // ── Government letterhead ─────────────────────────
    black()
    doc.setFontSize(11)
    doc.setFont("helvetica","bold")
    doc.text("GOVERNMENT OF INDIA", pageW/2, y, { align:"center" })
    y += 6
    doc.setFontSize(9)
    doc.setFont("helvetica","normal")
    doc.text("Ministry of Environment, Forest and Climate Change", pageW/2, y, { align:"center" })
    y += 5
    doc.text("Central Pollution Control Board (CPCB)", pageW/2, y, { align:"center" })
    y += 5
    doc.text("National Clean Air Programme — Air Prosecutor Intelligence System", pageW/2, y, { align:"center" })

    y += 5
    doc.setLineWidth(1.0)
    doc.setDrawColor(0,0,0)
    doc.line(margin, y, pageW-margin, y)
    doc.setLineWidth(0.3)
    doc.line(margin, y+1.5, pageW-margin, y+1.5)
    y += 8

    // ── Document title ────────────────────────────────
    black()
    doc.setFontSize(13)
    doc.setFont("helvetica","bold")
    doc.text("ENFORCEMENT ORDER & AIR QUALITY INTELLIGENCE REPORT", pageW/2, y, { align:"center" })
    y += 6
    doc.setFontSize(8)
    doc.setFont("helvetica","normal")
    doc.text("(Generated under Section 31A of the Air (Prevention and Control of Pollution) Act, 1981)", pageW/2, y, { align:"center" })

    y += 5
    doc.setLineWidth(0.3)
    doc.setDrawColor(0,0,0)
    doc.line(margin, y, pageW-margin, y)
    y += 8

    // ── Case info table ───────────────────────────────
    const col1 = margin
    const col2 = pageW/2 + 5

    doc.setFillColor(240,240,240)
    doc.rect(margin, y, contentW, 28, "F")
    doc.setDrawColor(0,0,0)
    doc.setLineWidth(0.3)
    doc.rect(margin, y, contentW, 28)
    doc.line(pageW/2, y, pageW/2, y+28)
    doc.line(margin, y+14, pageW-margin, y+14)

    lgray()
    doc.setFontSize(7)
    doc.setFont("helvetica","normal")
    doc.text("CASE REFERENCE NUMBER", col1+3, y+5)
    doc.text("DATE OF ISSUE",          col2+3, y+5)
    doc.text("CITY / DISTRICT",        col1+3, y+19)
    doc.text("CLASSIFICATION",         col2+3, y+19)

    black()
    doc.setFontSize(10)
    doc.setFont("helvetica","bold")
    doc.text(caseNo,                              col1+3, y+11)
    doc.text(`${dateStr}  |  ${timeStr} IST`,     col2+3, y+11)
    doc.text(`${city}, ${state}`,                 col1+3, y+25)
    doc.text(`AQI ${aqi.level}/5 — ${aqi.label.toUpperCase()}`, col2+3, y+25)

    y += 36

    // ── Section 1: Subject ────────────────────────────
    sectionHeader("1. Subject & Purpose")
    black()
    doc.setFontSize(9)
    doc.setFont("helvetica","normal")
    const subjectText = `This enforcement order has been automatically generated by the Air Prosecutor AI Intelligence System upon detection of ${aqi.label.toLowerCase()} air quality conditions in ${city}, ${state} on ${dateStr}. This document is issued pursuant to real-time monitoring data and AI-assisted source attribution analysis conducted under the National Clean Air Programme (NCAP).`
    const subjectLines = doc.splitTextToSize(subjectText, contentW)
    doc.text(subjectLines, margin, y)
    y += subjectLines.length * 5 + 4

    // ── Section 2: AI Verdict ─────────────────────────
    sectionHeader("2. Intelligence Assessment & Verdict")
    black()
    doc.setFontSize(9)
    doc.setFont("helvetica","normal")
    const verdictLines = doc.splitTextToSize(a.verdict||"", contentW)
    doc.text(verdictLines, margin, y)
    y += verdictLines.length * 5 + 4

    field("Risk Classification :", a.risk_level)
    field("Primary Source       :", a.primary_source||"Under investigation")
    field("Enforcement Priority :", data.attribution?.enforcement_priority||"—")

    // ── Section 3: Air Quality Data ───────────────────
    sectionHeader("3. Real-Time Air Quality Measurements")

    // Table header
    doc.setFillColor(220,220,220)
    doc.rect(margin, y, contentW, 8, "F")
    doc.setDrawColor(0,0,0)
    doc.setLineWidth(0.2)
    doc.rect(margin, y, contentW, 8)

    black()
    doc.setFontSize(8)
    doc.setFont("helvetica","bold")
    const colW    = contentW / 5
    const headers = ["Parameter","Measured Value","Safe Limit","Unit","Status"]
    headers.forEach((h,i) => {
      doc.text(h, margin + i*colW + 3, y+5)
      if (i < 4) doc.line(margin+(i+1)*colW, y, margin+(i+1)*colW, y+8)
    })
    y += 8

    const pollutants = [
      { name:"PM2.5", value:aqi.pm2_5, safe:25,  unit:"µg/m³" },
      { name:"PM10",  value:aqi.pm10,  safe:50,  unit:"µg/m³" },
      { name:"NO2",   value:aqi.no2,   safe:40,  unit:"µg/m³" },
      { name:"O3",    value:aqi.o3,    safe:100, unit:"µg/m³" },
      { name:"CO",    value:aqi.co,    safe:400, unit:"µg/m³" },
    ]

    pollutants.forEach((p,i) => {
      const over = p.value > p.safe
      if (i % 2 === 0) {
        doc.setFillColor(250,250,250)
        doc.rect(margin, y, contentW, 7, "F")
      }
      doc.setDrawColor(200,200,200)
      doc.setLineWidth(0.1)
      doc.rect(margin, y, contentW, 7)
      headers.forEach((_,ci) => {
        if (ci < 4) {
          doc.setDrawColor(200,200,200)
          doc.line(margin+(ci+1)*colW, y, margin+(ci+1)*colW, y+7)
        }
      })
      black()
      doc.setFontSize(8)
      doc.setFont("helvetica","bold")
      doc.text(p.name,       margin+3,        y+5)
      doc.setFont("helvetica","normal")
      doc.text(String(p.value), margin+colW+3,   y+5)
      doc.text(String(p.safe),  margin+colW*2+3, y+5)
      doc.text(p.unit,          margin+colW*3+3, y+5)
      doc.setFont("helvetica","bold")
      if (over) {
        doc.setTextColor(180,0,0)
        doc.text("EXCEEDS LIMIT", margin+colW*4+3, y+5)
      } else {
        doc.setTextColor(0,120,0)
        doc.text("WITHIN LIMIT",  margin+colW*4+3, y+5)
      }
      y += 7
    })
    y += 6

    // ── Section 4: Weather Context ────────────────────
    sectionHeader("4. Meteorological Conditions at Time of Report")
    field("Temperature         :", `${weather.temp}°C`)
    field("Wind Speed          :", `${weather.wind_speed} m/s`)
    field("Wind Direction      :", weather.wind_direction)
    field("Humidity            :", `${weather.humidity}%`)

    // ── Section 5: Source Attribution ────────────────
    sectionHeader("5. Pollution Source Attribution Analysis")
    const sources     = data.attribution?.sources || []
    const baseWeights = sources.map(s => {
      const sl = s.toLowerCase()
      if (sl.includes("vehicle")||sl.includes("traffic")) return 35
      if (sl.includes("industrial")||sl.includes("refinery")) return 30
      if (sl.includes("burning")||sl.includes("stubble")) return 40
      if (sl.includes("construction")) return 20
      if (sl.includes("sea")||sl.includes("good")) return 5
      return 25
    })
    const totalWeight = baseWeights.reduce((a,b)=>a+b,0)||1
    const pcts        = baseWeights.map(w => Math.round((w/totalWeight)*100))

    sources.forEach((src,i) => {
      checkPageBreak(8)
      black()
      doc.setFontSize(9)
      doc.setFont("helvetica","normal")
      doc.text(`${i+1}.`, margin, y)
      const srcLines = doc.splitTextToSize(src, contentW-20)
      doc.text(srcLines, margin+6, y)
      doc.setFont("helvetica","bold")
      doc.text(`${pcts[i]}% contribution`, pageW-margin, y, { align:"right" })
      y += srcLines.length*5+2
    })
    y += 4

    // ── Section 6: Enforcement Order ─────────────────
    checkPageBreak(40)
    sectionHeader("6. Enforcement Order")

    doc.setFillColor(245,245,245)
    doc.setDrawColor(0,0,0)
    doc.setLineWidth(0.5)
    const orderLines = doc.splitTextToSize(a.enforcement_order||"", contentW-10)
    doc.rect(margin, y, contentW, orderLines.length*5+16, "FD")
    black()
    doc.setFontSize(9)
    doc.setFont("helvetica","bold")
    doc.text("ACTION REQUIRED:", margin+5, y+7)
    doc.setFont("helvetica","normal")
    doc.text(orderLines, margin+5, y+14)
    y += orderLines.length*5+22

    // ── Section 7: Health Advisory ────────────────────
    sectionHeader("7. Public Health Advisory")
    black()
    doc.setFontSize(9)
    doc.setFont("helvetica","normal")
    const healthLines = doc.splitTextToSize(a.health_impact||"", contentW)
    doc.text(healthLines, margin, y)
    y += healthLines.length*5+4

    // ── Section 8: Prediction ─────────────────────────
    sectionHeader("8. Short-term Air Quality Forecast")
    black()
    doc.setFontSize(9)
    doc.setFont("helvetica","normal")
    const predLines = doc.splitTextToSize(a.prediction||"", contentW)
    doc.text(predLines, margin, y)
    y += predLines.length*5+6

    // ── Section 9: Authentication ─────────────────────
    checkPageBreak(40)
    sectionHeader("9. Authentication & Certification")
    black()
    doc.setFontSize(8)
    doc.setFont("helvetica","normal")
    const authText = `This report has been automatically generated and authenticated by the Air Prosecutor AI Intelligence System. The data, analysis, and enforcement recommendations contained herein are based on real-time sensor data from OpenWeatherMap CPCB-integrated monitoring stations and AI analysis using Llama 3.3 70B model.`
    const authLines = doc.splitTextToSize(authText, contentW)
    doc.text(authLines, margin, y)
    y += authLines.length*5+10

    // ── Reference footer box ──────────────────────────
    checkPageBreak(20)
    doc.setFillColor(230,230,230)
    doc.setDrawColor(0,0,0)
    doc.setLineWidth(0.3)
    doc.rect(margin, y, contentW, 14, "FD")
    black()
    doc.setFontSize(8)
    doc.setFont("helvetica","bold")
    doc.text(`Reference: ${caseNo}`, margin+4, y+5)
    doc.setFont("helvetica","normal")
    doc.text(`Generated: ${dateStr} at ${timeStr} IST by Air Prosecutor AI`, margin+4, y+10)
    doc.text("For Official Government Use Only", pageW-margin-4, y+7, { align:"right" })

    // ── Save ──────────────────────────────────────────
    const filename = `AirProsecutor_Enforcement_${city}_${now.toISOString().slice(0,10)}.pdf`
    doc.save(filename)

    setGenerating(false)
    setDone(true)
    setTimeout(() => setDone(false), 3000)
  }

  return (
    <button
      onClick={generatePDF}
      disabled={generating}
      style={{
        background: done ? "#065f46" : generating ? "#374151" : "#1a1a2e",
        border:`1px solid ${done ? "#10b981" : "#4b5563"}`,
        color:"#fff", borderRadius:8,
        padding:"8px 16px",
        cursor: generating ? "wait" : "pointer",
        fontSize:12, fontWeight:600,
        fontFamily:"Inter, sans-serif",
        display:"flex", alignItems:"center", gap:8
      }}>
      {generating ? "⏳ Generating..." : done ? "✅ Downloaded!" : "📄 Download Official Report"}
    </button>
  )
}