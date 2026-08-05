import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { loadAdaptiveTraining, loadDailyHabits, loadTrainingProfile, loadWorkoutOverrides, syncDailyHabits, syncWorkoutOverrides } from '../utils/dataSync'
import { formatHeight, getNextWorkout, getWorkoutOptions, isFixedRestDay } from '../utils/workoutLogic'
import { GOAL_LABELS } from '../utils/planGenerator'
import { formatDate } from '../utils/date'
import { getDateKey } from '../utils/date'

export default function Home() {
  const navigate = useNavigate()
  const { logout, currentUser } = useAuth() // ✅ Get current user
  const [todayWorkout, setTodayWorkout] = useState('')
  const [todayDate, setTodayDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [workoutOverrides, setWorkoutOverrides] = useState({})
  const [showWorkoutSelector, setShowWorkoutSelector] = useState(false)
  const [profile, setProfile] = useState(null)
  const [dailyHabits, setDailyHabits] = useState({ waterBottles: 0, waterGoal: 5 })
  const [waterGoal, setWaterGoal] = useState(5)
  const today = new Date()
  const todayKey = getDateKey(today)
  const isFixedRest = isFixedRestDay(today)

  useEffect(() => {
    const load = async () => {
      // ✅ Check if user exists first
      if (!currentUser) return 

      setTodayDate(formatDate(today))
      
      // ✅ Pass currentUser.uid to load the correct data
      const [overrides, trainingProfile, habits, adaptiveState] = await Promise.all([
        loadWorkoutOverrides(currentUser.uid),
        loadTrainingProfile(currentUser.uid),
        loadDailyHabits(currentUser.uid, todayKey),
        loadAdaptiveTraining(currentUser.uid)
      ])
      setWorkoutOverrides(overrides)
      setProfile(trainingProfile)
      setDailyHabits(habits)
      setWaterGoal(habits.waterGoal ?? trainingProfile?.preferredWaterGoal ?? 5)

      const workout = getNextWorkout(adaptiveState.lastLoggedWorkoutType || '', overrides[todayKey])
      setTodayWorkout(workout)
      setLoading(false)
    }
    load()
  }, [currentUser, todayKey]) // ✅ Re-run when user loads

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleWorkoutChange = async (newWorkout) => {
    if (!currentUser) return // ✅ Safety check

    const updated = { ...workoutOverrides, [todayKey]: newWorkout }
    setWorkoutOverrides(updated)
    setTodayWorkout(newWorkout)
    
    // ✅ Pass currentUser.uid so it actually saves to DB
    await syncWorkoutOverrides(currentUser.uid, updated)
    setShowWorkoutSelector(false)
  }

  const handleWaterToggle = async (index) => {
    if (!currentUser) return

    const nextCount = dailyHabits.waterBottles === index + 1 ? index : index + 1
    const nextHabits = {
      ...dailyHabits,
      waterBottles: nextCount,
      waterGoal,
    }

    setDailyHabits(nextHabits)
    await syncDailyHabits(currentUser.uid, todayKey, nextHabits)
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
            <p className="text-gray-400 mt-4 text-sm">
              {profile?.name ? `Welcome back, ${profile.name}` : currentUser.email}
            </p>
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
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
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

        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-cyan-300 text-sm uppercase tracking-[0.3em] font-bold">Daily Habit</p>
              <h3 className="text-3xl font-black text-white mt-2">Water Tracker</h3>
              <p className="text-gray-300 mt-3">
                Goal: {waterGoal} bottles today. Tap a box each time you finish one.
              </p>
            </div>
            <div className="rounded-2xl bg-cyan-500/10 border border-cyan-400/20 px-5 py-4">
              <p className="text-cyan-200 text-sm uppercase tracking-wider">Today</p>
              <p className="text-white text-2xl font-black mt-1">
                {dailyHabits.waterBottles} / {waterGoal}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-3 mt-6">
            {Array.from({ length: waterGoal }, (_, index) => {
              const filled = index < dailyHabits.waterBottles

              return (
                <button
                  key={index}
                  onClick={() => handleWaterToggle(index)}
                  className={`rounded-2xl border px-3 py-5 transition-all ${
                    filled
                      ? 'bg-cyan-400/20 border-cyan-300 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.16)]'
                      : 'bg-black/20 border-white/10 text-gray-300 hover:bg-white/10'
                  }`}
                  aria-label={`Water bottle ${index + 1}`}
                >
                  <div className="text-3xl sm:text-4xl">{filled ? '💧' : '🫙'}</div>
                </button>
              )
            })}
          </div>
        </div>

        {profile && (
          <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <p className="text-blue-300 text-sm uppercase tracking-[0.3em] font-bold">Personalized Plan</p>
                <h3 className="text-3xl font-black text-white mt-2">Built around your current profile</h3>
                <p className="text-gray-300 mt-3 max-w-2xl">
                  {profile.age}-year-old {String(profile.sex || '').toLowerCase()}, {formatHeight(profile)}, {profile.bodyweight} lb. The progression engine uses your weigh-ins, rep completion, and consistency to decide whether to increase, hold, or reduce weight next session.
                </p>
              </div>
              <button
                onClick={() => navigate('/edit')}
                className="px-5 py-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-400/30 font-semibold transition-all"
              >
                Edit Plan
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="bg-black/20 rounded-2xl p-4 border border-white/10">
                <p className="text-gray-400 text-sm uppercase tracking-wider">Primary Goal</p>
                <p className="text-white text-xl font-bold mt-1">{GOAL_LABELS[profile.goal] || profile.goal}</p>
              </div>
              <div className="bg-black/20 rounded-2xl p-4 border border-white/10">
                <p className="text-gray-400 text-sm uppercase tracking-wider">Current Weight</p>
                <p className="text-white text-xl font-bold mt-1">{profile.bodyweight} lb</p>
              </div>
              <div className="bg-black/20 rounded-2xl p-4 border border-white/10">
                <p className="text-gray-400 text-sm uppercase tracking-wider">Experience</p>
                <p className="text-white text-xl font-bold mt-1 capitalize">{profile.experience || 'Not set'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
