import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"
import { AnimatePresence } from "framer-motion"
import Navbar      from "./components/Navbar"
import Dashboard   from "./pages/Dashboard"
import CityDetail  from "./pages/CityDetail"
import Enforcement from "./pages/Enforcement"
import Alerts      from "./pages/Alerts"

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/"           element={<Dashboard />}   />
        <Route path="/city/:city" element={<CityDetail />}  />
        <Route path="/enforce"    element={<Enforcement />} />
        <Route path="/alerts"     element={<Alerts />}      />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <AnimatedRoutes />
    </BrowserRouter>
  )
}