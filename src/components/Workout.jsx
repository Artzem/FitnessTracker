import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadSchedule, loadWorkouts, loadWorkoutProgress, syncWorkoutProgress } from '../utils/dataSync'
import { getTodayWorkout } from '../utils/workoutLogic'
import { getDateKey } from '../utils/date'

export default function Workout() {
  const navigate = useNavigate()
  const [todayWorkout, setTodayWorkout] = useState('')
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const load = async () => {
      try {
        const today = new Date()
        const dateKey = getDateKey(today)
        
        const schedule = await loadSchedule()
        const workout = getTodayWorkout(today, schedule.skippedDays || [])
        setTodayWorkout(workout)

        const allWorkouts = await loadWorkouts()
        let exerciseList = allWorkouts[workout] || []
        
        // Load saved progress for today
        const savedProgress = await loadWorkoutProgress(dateKey)
        if (savedProgress && savedProgress.workout === workout && savedProgress.exercises) {
          exerciseList = savedProgress.exercises
        }
        
        setExercises(exerciseList)
        calculateProgress(exerciseList)
        setLoading(false)
      } catch (error) {
        console.error('Error loading workout:', error)
        setLoading(false)
      }
    }
    load()
  }, [])

  const calculateProgress = (exerciseList) => {
    if (exerciseList.length === 0) {
      setProgress(0)
      return
    }
    let totalSets = 0
    let completedSets = 0
    
    exerciseList.forEach(ex => {
      if (ex.sets && Array.isArray(ex.sets)) {
        ex.sets.forEach(set => {
          totalSets++
          if (set.completed) completedSets++
        })
      }
    })
    
    setProgress(totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0)
  }

  const toggleSet = async (exerciseIdx, setIdx) => {
    const updated = exercises.map((ex, idx) => {
      if (idx === exerciseIdx) {
        const newSets = ex.sets.map((set, sIdx) => 
          sIdx === setIdx ? { ...set, completed: !set.completed } : set
        )
        return { ...ex, sets: newSets }
      }
      return ex
    })
    
    setExercises(updated)
    calculateProgress(updated)
    
    // Save progress
    const today = new Date()
    const dateKey = getDateKey(today)
    await syncWorkoutProgress(dateKey, {
      workout: todayWorkout,
      exercises: updated,
      date: dateKey
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto pt-4 pb-8">
        <button
          onClick={() => navigate('/')}
          className="group flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold mb-8 transition-all"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          <span>Back to Home</span>
        </button>

        <div className="relative group mb-8">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
          <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
            <div className="p-8 sm:p-12">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-5xl sm:text-6xl font-black text-white mb-2">{todayWorkout}</h1>
                  <p className="text-gray-400 text-lg">Today's Training Session</p>
                </div>
                <div className="text-6xl">💪</div>
              </div>
              
              {exercises.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-semibold">Overall Progress</span>
                    <span className="text-white font-bold">{progress}%</span>
                  </div>
                  <div className="w-full bg-black/30 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {exercises.length === 0 ? (
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl blur opacity-50"></div>
            <div className="relative bg-white/10 backdrop-blur-xl p-16 rounded-3xl border border-white/20 text-center">
              <div className="text-7xl mb-4">😴</div>
              <h3 className="text-3xl font-bold text-white mb-2">Rest Day</h3>
              <p className="text-gray-400 text-lg">Recovery is part of the process</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {exercises.map((ex, exerciseIdx) => {
              const allSetsComplete = ex.sets && ex.sets.every(set => set.completed)
              const completedCount = ex.sets ? ex.sets.filter(set => set.completed).length : 0
              const totalSets = ex.sets ? ex.sets.length : 0
              
              return (
                <div key={exerciseIdx} className="group relative">
                  <div className={`absolute -inset-0.5 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-300 ${
                    allSetsComplete
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600' 
                      : 'bg-gradient-to-r from-blue-600 to-purple-600'
                  }`}></div>
                  <div className={`relative backdrop-blur-xl rounded-2xl border p-6 transition-all duration-300 ${
                    allSetsComplete
                      ? 'bg-green-500/10 border-green-500/30' 
                      : 'bg-white/10 border-white/20'
                  }`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className={`text-2xl font-bold mb-2 ${allSetsComplete ? 'text-green-300' : 'text-white'}`}>
                          {ex.name}
                        </h3>
                      </div>
                      <div className="text-4xl ml-4">
                        {allSetsComplete ? '✅' : exerciseIdx === 0 ? '🔥' : exerciseIdx === 1 ? '💯' : '⭐'}
                      </div>
                    </div>
                    
                    {/* Set Checkboxes */}
                    <div className="flex flex-wrap gap-3">
                      {ex.sets && ex.sets.map((set, setIdx) => {
                        return (
                          <button
                            key={setIdx}
                            onClick={() => toggleSet(exerciseIdx, setIdx)}
                            className={`flex flex-col items-start gap-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                              set.completed
                                ? 'bg-green-500/30 border-2 border-green-500 text-green-300'
                                : 'bg-white/10 border-2 border-white/20 text-white hover:border-white/40'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{set.completed ? '✓' : '○'}</span>
                              <span>Set {setIdx + 1}</span>
                            </div>
                            <div className="text-xs opacity-70">
                              {set.weight && <span>{set.weight} × </span>}
                              <span>{set.reps} reps</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    
                    {/* Progress for this exercise */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-1 text-xs text-gray-400">
                        <span>Exercise Progress</span>
                        <span>{completedCount}/{totalSets} sets</span>
                      </div>
                      <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            allSetsComplete 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                              : 'bg-gradient-to-r from-blue-500 to-purple-500'
                          }`}
                          style={{ width: `${totalSets > 0 ? (completedCount / totalSets) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}