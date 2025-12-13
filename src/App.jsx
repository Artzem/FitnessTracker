import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Home from './pages/Home'
import Workout from './pages/Workout'
import Food from './pages/Food'
import Edit from './pages/Edit'
import Calendar from './pages/Calendar'
import DayDetail from './pages/DayDetail'

function PrivateRoute({ children }) {
  const { currentUser } = useAuth()
  return currentUser ? children : <Navigate to="/login" />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/workout" element={<PrivateRoute><Workout /></PrivateRoute>} />
          <Route path="/food" element={<PrivateRoute><Food /></PrivateRoute>} />
          <Route path="/edit" element={<PrivateRoute><Edit /></PrivateRoute>} />
          <Route path="/calendar" element={<PrivateRoute><Calendar /></PrivateRoute>} />
          <Route path="/day/:dateKey" element={<PrivateRoute><DayDetail /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App