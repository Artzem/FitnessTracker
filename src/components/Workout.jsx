import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { loadSchedule, loadWorkouts, loadWorkoutProgress, syncWorkoutProgress } from '../utils/dataSync'
import { getTodayWorkout } from '../utils/workoutLogic'
import { getDateKey } from '../utils/date'

export default function Workout() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [todayWorkout, setTodayWorkout] = useState('')
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const load = async () => {
      if (!currentUser) return;
      try {
        const today = new Date()
        const schedule = await loadSchedule(currentUser.uid)
        const workoutName = getTodayWorkout(today, schedule.overrides || {})
        setTodayWorkout(workoutName)

        const allWorkouts = await loadWorkouts(currentUser.uid)
        let exerciseList = allWorkouts[workoutName] || []
        
        const savedProgress = await loadWorkoutProgress(currentUser.uid, getDateKey(today))
        if (savedProgress && savedProgress.workout === workoutName && savedProgress.exercises) {
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
  }, [currentUser])

  const calculateProgress = (list) => {
    let total = 0, done = 0
    list.forEach(ex => ex.sets?.forEach(s => { total++; if (s.completed) done++; }))
    setProgress(total > 0 ? Math.round((done / total) * 100) : 0)
  }

  const toggleSet = async (exIdx, sIdx) => {
    const updated = exercises.map((ex, i) => i === exIdx ? {
      ...ex, sets: ex.sets.map((s, j) => j === sIdx ? { ...s, completed: !s.completed } : s)
    } : ex)
    
    setExercises(updated)
    calculateProgress(updated)
    
    await syncWorkoutProgress(currentUser.uid, getDateKey(new Date()), {
      workout: todayWorkout,
      exercises: updated
    })
  }

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 p-6 text-white">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/')} className="mb-8 text-blue-400 font-bold uppercase tracking-widest hover:text-blue-300">← Home</button>
        
        <div className="bg-white/10 backdrop-blur-md p-10 rounded-3xl border border-white/20 mb-8 shadow-2xl">
          <h1 className="text-6xl font-black uppercase tracking-tighter italic mb-4">{todayWorkout}</h1>
          <div className="w-full bg-black/40 rounded-full h-4">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-700" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {exercises.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
            <p className="text-2xl font-bold">Rest Day 😴</p>
          </div>
        ) : (
          <div className="space-y-6">
            {exercises.map((ex, i) => (
              <div key={i} className="bg-white/10 p-8 rounded-2xl border border-white/10">
                <h3 className="text-2xl font-bold mb-6 border-b border-white/10 pb-2 uppercase tracking-wide">{ex.name}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {ex.sets.map((s, j) => (
                    <button
                      key={j}
                      onClick={() => toggleSet(i, j)}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                        s.completed 
                          ? 'bg-green-500/40 border-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]' 
                          : 'bg-white/5 border-white/10 hover:bg-white/15'
                      }`}
                    >
                      {/* Show weight if it exists and isn't empty, otherwise show reps larger */}
                      {s.weight ? (
                        <>
                          <span className="text-xl font-black">{s.weight} lbs</span>
                          <span className="text-xs uppercase opacity-60 font-bold">{s.reps} reps</span>
                        </>
                      ) : (
                        <span className="text-xl font-black py-1">{s.reps}</span>
                      )}
                      {s.completed && <span className="mt-1 text-sm">✓ Done</span>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}