import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { loadWorkoutOverrides, syncWorkoutOverrides } from '../utils/dataSync'
import { getTodayWorkout, getWorkoutOptions, isFixedRestDay } from '../utils/workoutLogic'
import { formatDate } from '../utils/date'
import { getDateKey } from '../utils/date'

export default function Home() {
  const navigate = useNavigate()
  const { logout, currentUser } = useAuth()
  const [todayWorkout, setTodayWorkout] = useState('')
  const [todayDate, setTodayDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [workoutOverrides, setWorkoutOverrides] = useState({})
  const [showWorkoutSelector, setShowWorkoutSelector] = useState(false)
  const today = new Date()
  const todayKey = getDateKey(today)
  const isFixedRest = isFixedRestDay(today)

  useEffect(() => {
    const load = async () => {
      setTodayDate(formatDate(today))
      
      const overrides = await loadWorkoutOverrides()
      setWorkoutOverrides(overrides)
      
      const workout = getTodayWorkout(today, overrides)
      setTodayWorkout(workout)
      setLoading(false)
    }
    load()
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleWorkoutChange = async (newWorkout) => {
    const updated = { ...workoutOverrides, [todayKey]: newWorkout }
    setWorkoutOverrides(updated)
    setTodayWorkout(newWorkout)
    await syncWorkoutOverrides(updated)
    setShowWorkoutSelector(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 sm:p-8 relative">
      <button
        onClick={handleLogout}
        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-all px-4 py-2 rounded-lg hover:bg-white/10"
      >
        Logout
      </button>

      <div className="max-w-4xl mx-auto space-y-8 pt-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl sm:text-6xl font-black text-white mb-2 tracking-tight">
            FitTrack
          </h1>
          <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
          {currentUser && (
            <p className="text-gray-400 mt-4 text-sm">{currentUser.email}</p>
          )}
        </div>

        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl">
            <div className="text-center">
              <p className="text-gray-300 text-lg mb-3 font-medium">{todayDate}</p>
              
              <div className="flex items-center justify-center gap-4 mb-2">
                <h2 className="text-5xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {todayWorkout}
                </h2>
                {!isFixedRest && (
                  <button
                    onClick={() => setShowWorkoutSelector(!showWorkoutSelector)}
                    className="text-2xl hover:scale-110 transition-transform"
                    title="Change workout"
                  >
                    ⚙️
                  </button>
                )}
              </div>
              
              {isFixedRest && (
                <p className="text-yellow-400 text-sm mb-2">📌 Fixed rest day</p>
              )}
              
              <p className="text-gray-400 text-sm uppercase tracking-wider">Today's Focus</p>
              
              {showWorkoutSelector && !isFixedRest && (
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {getWorkoutOptions().map(option => (
                    <button
                      key={option}
                      onClick={() => handleWorkoutChange(option)}
                      className={`p-4 rounded-xl font-semibold transition-all ${
                        option === todayWorkout
                          ? 'bg-purple-500/30 border-2 border-purple-500 text-purple-300'
                          : 'bg-white/10 border-2 border-white/20 text-white hover:border-white/40'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/workout')}
            className="group relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-10 rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2"
          >
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300"></div>
            <div className="relative z-10">
              <div className="text-4xl mb-2">💪</div>
              <div className="text-xl font-black">Workout</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/food')}
            className="group relative overflow-hidden bg-gradient-to-br from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 text-white font-bold py-10 rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2"
          >
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300"></div>
            <div className="relative z-10">
              <div className="text-4xl mb-2">🥗</div>
              <div className="text-xl font-black">Food</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/calendar')}
            className="group relative overflow-hidden bg-gradient-to-br from-orange-600 to-red-700 hover:from-orange-500 hover:to-red-600 text-white font-bold py-10 rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2"
          >
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300"></div>
            <div className="relative z-10">
              <div className="text-4xl mb-2">📅</div>
              <div className="text-xl font-black">Calendar</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/edit')}
            className="group relative overflow-hidden bg-gradient-to-br from-purple-600 to-pink-700 hover:from-purple-500 hover:to-pink-600 text-white font-bold py-10 rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2"
          >
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300"></div>
            <div className="relative z-10">
              <div className="text-4xl mb-2">⚙️</div>
              <div className="text-xl font-black">Edit</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}