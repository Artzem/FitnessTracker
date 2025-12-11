import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './components/Home'
import Workout from './components/Workout'
import Food from './components/Food'
import Edit from './components/Edit'
import Calendar from './pages/Calendar'
import DayDetail from './pages/DayDetail'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/workout" element={<Workout />} />
        <Route path="/food" element={<Food />} />
        <Route path="/edit" element={<Edit />} />
         <Route path="/calendar" element={<Calendar />} />
        <Route path="/day/:dateKey" element={<DayDetail />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App