import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadSchedule } from '../utils/dataSync'
import { getTodayWorkout } from '../utils/workoutLogic'
import { formatDate } from '../utils/date'

export default function Home() {
  const navigate = useNavigate()
  const [todayWorkout, setTodayWorkout] = useState('')
  const [todayDate, setTodayDate] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const today = new Date()
      setTodayDate(formatDate(today))
      
      const schedule = await loadSchedule()
      const workout = getTodayWorkout(today, schedule.skippedDays || [])
      setTodayWorkout(workout)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8 pt-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl sm:text-6xl font-black text-white mb-2 tracking-tight">
            FitTrack
          </h1>
          <div className="h-1 w-24 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl">
            <div className="text-center">
              <p className="text-gray-300 text-lg mb-3 font-medium">{todayDate}</p>
              <h2 className="text-5xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                {todayWorkout}
              </h2>
              <p className="text-gray-400 mt-2 text-sm uppercase tracking-wider">Today's Focus</p>
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