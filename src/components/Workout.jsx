import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  loadLastLoggedWorkout,
  loadTrainingProfile,
  loadWorkoutOverrides,
  loadWorkouts,
  loadWorkoutProgress,
  syncWorkoutProgress
} from '../utils/dataSync'
import { getNextWorkout, getWorkoutOptions } from '../utils/workoutLogic'
import { getDateKey } from '../utils/date'

const formatWeight = (weight, units) =>
  !weight || String(weight).toUpperCase() === 'BW' ? 'Bodyweight' : `${weight} ${units}`

const isDone = (exercise) => exercise.sets.length > 0 && exercise.sets.every((set) => set.completed)

export default function Workout() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [todayWorkout, setTodayWorkout] = useState('')
  const [exercises, setExercises] = useState([])
  const [units, setUnits] = useState('lb')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const dateKey = getDateKey(new Date())

  useEffect(() => {
    const load = async () => {
      if (!currentUser) return

      try {
        const [allWorkouts, profile, savedProgress, overrides, lastLogged] = await Promise.all([
          loadWorkouts(currentUser.uid),
          loadTrainingProfile(currentUser.uid),
          loadWorkoutProgress(currentUser.uid, dateKey),
          loadWorkoutOverrides(currentUser.uid),
          loadLastLoggedWorkout(currentUser.uid, dateKey),
        ])

        // Today's saved session wins, otherwise the override or the next in the rotation
        const workoutName = getWorkoutOptions().includes(savedProgress?.workout)
          ? savedProgress.workout
          : getNextWorkout(lastLogged, overrides[dateKey])

        setTodayWorkout(workoutName)
        setUnits(profile.units || 'lb')
        setExercises(savedProgress?.exercises?.length ? savedProgress.exercises : allWorkouts[workoutName] || [])
      } catch (error) {
        console.error('Error loading workout:', error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [currentUser, dateKey])

  const persist = async (updated) => {
    setSaving(true)
    try {
      await syncWorkoutProgress(currentUser.uid, dateKey, { workout: todayWorkout, exercises: updated, date: dateKey })
    } catch (error) {
      console.error('Save failed:', error)
      alert(`Failed to save: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const toggleExercise = async (exIdx) => {
    const completed = !isDone(exercises[exIdx])
    const updated = exercises.map((exercise, i) =>
      i === exIdx ? { ...exercise, sets: exercise.sets.map((set) => ({ ...set, completed })) } : exercise
    )
    setExercises(updated)
    await persist(updated)
  }

  const finishWorkout = async () => {
    await persist(exercises)
    navigate('/')
  }

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>

  const doneCount = exercises.filter(isDone).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 p-6 text-white">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => navigate('/')} className="text-blue-400 font-bold uppercase tracking-widest hover:text-blue-300">← Home</button>
          {saving && <span className="text-green-400 text-sm font-bold animate-pulse">SAVING...</span>}
        </div>

        <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 mb-6 shadow-2xl">
          <h1 className="text-5xl font-black uppercase tracking-tighter italic mb-4">{todayWorkout}</h1>
          <div className="w-full bg-black/40 rounded-full h-4">
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${exercises.length ? (doneCount / exercises.length) * 100 : 0}%` }}
            />
          </div>
          <p className="text-gray-300 text-sm mt-3">{doneCount} of {exercises.length} exercises done</p>
        </div>

        {exercises.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
            <p className="text-2xl font-bold">No exercises in this workout</p>
          </div>
        ) : (
          <div className="space-y-3">
            {exercises.map((exercise, exIdx) => {
              const done = isDone(exercise)
              const first = exercise.sets[0]

              return (
                <div
                  key={exIdx}
                  className={`flex items-center justify-between gap-4 p-5 rounded-2xl border transition-all ${
                    done ? 'bg-green-500/20 border-green-400' : 'bg-white/10 border-white/10'
                  }`}
                >
                  <div>
                    <p className="text-xl font-bold">{exercise.name}</p>
                    <p className="text-sm text-gray-300 mt-1">
                      {formatWeight(first?.weight, units)} · {exercise.sets.length} × {first?.reps}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleExercise(exIdx)}
                    aria-label={done ? `Undo ${exercise.name}` : `Mark ${exercise.name} done`}
                    className={`h-12 w-12 shrink-0 rounded-xl text-2xl font-black transition-all ${
                      done ? 'bg-green-500 text-slate-950 hover:bg-green-400' : 'bg-white/10 border border-white/20 hover:bg-white/20'
                    }`}
                  >
                    {done ? '✓' : ''}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        <button
          onClick={finishWorkout}
          disabled={saving}
          className="w-full mt-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-black text-lg transition-all"
        >
          Finish Workout
        </button>
      </div>
    </div>
  )
}
