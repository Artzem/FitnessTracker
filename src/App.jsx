import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './components/Login'
import Signup from './components/Signup'
import Onboarding from './components/Onboarding'
import Home from './components/Home'
import Workout from './components/Workout'
import Food from './components/Food'
import Edit from './components/Edit'
import Calendar from './components/Calendar'
import DayDetail from './components/DayDetail'

const LoadingScreen = () => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center">
    <div className="text-white text-xl animate-pulse">Loading...</div>
  </div>
)

// requireOnboarding=true (default): also redirects to /onboarding if not done
// requireOnboarding=false: used for the /onboarding route itself
function PrivateRoute({ children, requireOnboarding = true }) {
  const { currentUser, loading, onboardingComplete } = useAuth()

  if (loading) return <LoadingScreen />
  if (!currentUser) return <Navigate to="/login" />
  if (requireOnboarding && !onboardingComplete) return <Navigate to="/onboarding" />

  return children
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/onboarding" element={<PrivateRoute requireOnboarding={false}><Onboarding /></PrivateRoute>} />
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