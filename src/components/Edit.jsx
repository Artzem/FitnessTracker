import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { addOrMergeFoodLibraryItems, loadWorkouts, syncWorkouts, loadFoodList, syncFoodList, loadTrainingProfile, syncTrainingProfile } from '../utils/dataSync'
import { DEFAULT_PROFILE, getWorkoutOptions } from '../utils/workoutLogic'
import { defaultWorkouts } from '../utils/basicFitPlan'

const WORKOUT_OPTIONS = getWorkoutOptions()

const TABS = [
  { id: 'workouts', label: 'Workouts', icon: '💪', active: 'from-blue-600 to-purple-600' },
  { id: 'food', label: 'Food Library', icon: '🥗', active: 'from-green-600 to-emerald-600' },
  { id: 'settings', label: 'Settings', icon: '⚙️', active: 'from-cyan-600 to-blue-600' },
]

const inputClass = 'w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none'

export default function Edit() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()

  const [tab, setTab] = useState('workouts')
  const [workouts, setWorkouts] = useState({})
  const [selectedWorkout, setSelectedWorkout] = useState(WORKOUT_OPTIONS[0])
  const [profile, setProfile] = useState(DEFAULT_PROFILE)

  // Food state
  const [foodList, setFoodList] = useState([])
  const [newFoodItem, setNewFoodItem] = useState({ name: '', calories: '', protein: '', quantity: '1' })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!currentUser) return

      const [data, foods, trainingProfile] = await Promise.all([
        loadWorkouts(currentUser.uid),
        loadFoodList(currentUser.uid),
        loadTrainingProfile(currentUser.uid),
      ])

      setWorkouts(data)
      setFoodList(foods)
      setProfile(trainingProfile)
      setLoading(false)
    }
    load()
  }, [currentUser])

  const exercises = workouts[selectedWorkout] || []

  // Update local state only; inputs persist on blur
  const setExercises = (next) => setWorkouts((current) => ({ ...current, [selectedWorkout]: next }))

  const saveWorkouts = async (next) => {
    if (!currentUser) return
    setWorkouts(next)
    await syncWorkouts(currentUser.uid, next)
  }

  const saveExercises = (next) => saveWorkouts({ ...workouts, [selectedWorkout]: next })

  const addExercise = () =>
    saveExercises([...exercises, { name: 'New Exercise', sets: Array.from({ length: 3 }, () => ({ weight: '', reps: '10', completed: false })) }])

  const removeExercise = (idx) => saveExercises(exercises.filter((_, i) => i !== idx))

  const moveExercise = (idx, direction) => {
    const target = idx + direction
    if (target < 0 || target >= exercises.length) return
    const next = [...exercises]
    ;[next[idx], next[target]] = [next[target], next[idx]]
    saveExercises(next)
  }

  const renameExercise = (idx, name) =>
    setExercises(exercises.map((ex, i) => (i === idx ? { ...ex, name } : ex)))

  // Weight and reps apply to every set of the exercise
  const setExerciseField = (idx, field, value) =>
    setExercises(exercises.map((ex, i) => (
      i === idx ? { ...ex, sets: ex.sets.map((set) => ({ ...set, [field]: value })) } : ex
    )))

  const setSetCount = (idx, count) => {
    if (!(count >= 1)) return
    setExercises(exercises.map((ex, i) => {
      if (i !== idx) return ex
      const template = ex.sets[0] || { weight: '', reps: '10' }
      return { ...ex, sets: Array.from({ length: count }, (_, s) => ex.sets[s] || { ...template, completed: false }) }
    }))
  }

  const persistWorkouts = () => currentUser && syncWorkouts(currentUser.uid, workouts)

  const loadBasicFitPlan = async () => {
    if (!window.confirm('Replace your Push, Pull and Legs workouts with the Basic-Fit plan?')) return
    await saveWorkouts(defaultWorkouts)
  }

  // Food management
  const addFoodToList = async () => {
    if (!currentUser || !newFoodItem.name.trim()) return

    const updated = await addOrMergeFoodLibraryItems(currentUser.uid, [newFoodItem], {
      source: 'manual',
      incrementUsage: false
    })
    setFoodList(updated)
    setNewFoodItem({ name: '', calories: '', protein: '', quantity: '1' })
  }

  const removeFoodFromList = async (idx) => {
    if (!currentUser) return

    const updated = foodList.filter((_, i) => i !== idx)
    setFoodList(updated)
    await syncFoodList(currentUser.uid, updated)
  }

  const updateProfileField = (field, value) => {
    const numericFields = ['calorieGoal', 'proteinGoal']
    setProfile((current) => ({ ...current, [field]: numericFields.includes(field) ? Number(value || 0) : value }))
  }

  const saveProfile = async () => {
    if (!currentUser) return
    await syncTrainingProfile(currentUser.uid, profile)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto pt-4 pb-8">
        <button
          onClick={() => navigate('/')}
          className="group flex items-center gap-2 text-purple-400 hover:text-purple-300 font-semibold mb-8 transition-all"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          <span>Back to Home</span>
        </button>

        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
          <div className="flex border-b border-white/10">
            {TABS.map(({ id, label, icon, active }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex-1 py-6 font-bold text-lg transition-all relative ${
                  tab === id ? 'text-white' : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab === id && <div className={`absolute inset-0 bg-gradient-to-r ${active}`}></div>}
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span className="text-2xl">{icon}</span>
                  <span>{label}</span>
                </span>
              </button>
            ))}
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {tab === 'workouts' && (
              <>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={selectedWorkout}
                    onChange={(e) => setSelectedWorkout(e.target.value)}
                    className="flex-1 p-4 bg-white/5 border border-white/20 rounded-xl text-white font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    {WORKOUT_OPTIONS.map((w) => (
                      <option key={w} className="bg-slate-900">{w}</option>
                    ))}
                  </select>
                  <button
                    onClick={addExercise}
                    className="px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-xl font-semibold transition-all"
                  >
                    ➕ Add Exercise
                  </button>
                </div>

                <div className="space-y-3">
                  {exercises.map((ex, idx) => (
                    <div key={idx} className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={ex.name}
                          onChange={(e) => renameExercise(idx, e.target.value)}
                          onBlur={persistWorkouts}
                          placeholder="Exercise name"
                          className={`${inputClass} font-bold`}
                        />
                        <button
                          onClick={() => moveExercise(idx, -1)}
                          disabled={idx === 0}
                          aria-label="Move up"
                          className="px-3 bg-white/10 hover:bg-white/20 rounded-lg text-white disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveExercise(idx, 1)}
                          disabled={idx === exercises.length - 1}
                          aria-label="Move down"
                          className="px-3 bg-white/10 hover:bg-white/20 rounded-lg text-white disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => removeExercise(idx)}
                          aria-label="Delete exercise"
                          className="px-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-all"
                        >
                          🗑️
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <label className="text-xs uppercase tracking-wider text-gray-400">
                          Weight ({profile.units || 'lb'})
                          <input
                            type="text"
                            value={ex.sets[0]?.weight ?? ''}
                            onChange={(e) => setExerciseField(idx, 'weight', e.target.value)}
                            onBlur={persistWorkouts}
                            placeholder="BW"
                            className={`${inputClass} mt-1 text-sm normal-case tracking-normal`}
                          />
                        </label>
                        <label className="text-xs uppercase tracking-wider text-gray-400">
                          Sets
                          <input
                            type="number"
                            min="1"
                            value={ex.sets.length}
                            onChange={(e) => setSetCount(idx, Number(e.target.value))}
                            onBlur={persistWorkouts}
                            className={`${inputClass} mt-1 text-sm normal-case tracking-normal`}
                          />
                        </label>
                        <label className="text-xs uppercase tracking-wider text-gray-400">
                          Reps
                          <input
                            type="text"
                            value={ex.sets[0]?.reps ?? ''}
                            onChange={(e) => setExerciseField(idx, 'reps', e.target.value)}
                            onBlur={persistWorkouts}
                            placeholder="8-12"
                            className={`${inputClass} mt-1 text-sm normal-case tracking-normal`}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={loadBasicFitPlan}
                  className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-xl transition-all"
                >
                  Load Basic-Fit plan
                </button>
              </>
            )}

            {tab === 'food' && (
              <>
                <div className="space-y-4">
                  <h3 className="font-black text-2xl text-white">Food Library</h3>
                  <p className="text-gray-400">Add foods to your library to quickly track them daily</p>
                  
                  <div className="space-y-3">
                    {foodList.map((food, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10">
                        <div>
                          <div className="flex items-center gap-3">
                            <p className="font-bold text-white">{food.name}</p>
                            {!!food.useCount && (
                              <span className="text-[10px] uppercase tracking-[0.2em] px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-400/20">
                                {food.useCount}x used
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-400">{food.calories} cal • {food.protein}p</p>
                          {food.portion && <p className="text-xs text-gray-500 mt-1">{food.portion}</p>}
                        </div>
                        <button
                          onClick={() => removeFoodFromList(idx)}
                          className="text-red-400 hover:text-red-300"
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-white/10 pt-6 space-y-3">
                    <h4 className="font-bold text-white">Add New Food</h4>
                    <input
                      type="text"
                      value={newFoodItem.name}
                      onChange={(e) => setNewFoodItem({ ...newFoodItem, name: e.target.value })}
                      placeholder="Food name"
                      className="w-full p-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 font-medium focus:ring-2 focus:ring-green-500 outline-none"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        value={newFoodItem.calories}
                        onChange={(e) => setNewFoodItem({ ...newFoodItem, calories: e.target.value })}
                        placeholder="Calories"
                        className="p-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 font-medium focus:ring-2 focus:ring-green-500 outline-none"
                      />
                      <input
                        type="number"
                        value={newFoodItem.protein}
                        onChange={(e) => setNewFoodItem({ ...newFoodItem, protein: e.target.value })}
                        placeholder="Protein (g)"
                        className="p-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 font-medium focus:ring-2 focus:ring-green-500 outline-none"
                      />
                      <input
                        type="number"
                        min="1"
                        value={newFoodItem.quantity}
                        onChange={(e) => setNewFoodItem({ ...newFoodItem, quantity: e.target.value })}
                        placeholder="Quantity"
                        className="p-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 font-medium focus:ring-2 focus:ring-green-500 outline-none"
                      />
                    </div>
                    <button
                      onClick={addFoodToList}
                      className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-xl transition-all"
                    >
                      ➕ Add to Library
                    </button>
                  </div>
                </div>
              </>
            )}

            {tab === 'settings' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block text-sm font-bold text-cyan-300 uppercase tracking-wider">
                    Daily Calories
                    <input
                      type="number"
                      value={profile.calorieGoal || 2000}
                      onChange={(e) => updateProfileField('calorieGoal', e.target.value)}
                      className={`${inputClass} mt-2 p-4 rounded-xl`}
                    />
                  </label>
                  <label className="block text-sm font-bold text-cyan-300 uppercase tracking-wider">
                    Daily Protein (g)
                    <input
                      type="number"
                      value={profile.proteinGoal || 130}
                      onChange={(e) => updateProfileField('proteinGoal', e.target.value)}
                      className={`${inputClass} mt-2 p-4 rounded-xl`}
                    />
                  </label>
                </div>

                <div>
                  <p className="text-sm font-bold text-cyan-300 uppercase tracking-wider mb-2">Units</p>
                  <div className="grid grid-cols-2 gap-2">
                    {['lb', 'kg'].map((unit) => (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => updateProfileField('units', unit)}
                        className={`py-4 rounded-xl font-semibold transition-all ${
                          (profile.units || 'lb') === unit
                            ? 'bg-cyan-500/30 border-2 border-cyan-400 text-cyan-200'
                            : 'bg-white/5 border-2 border-white/10 text-gray-300 hover:border-white/30'
                        }`}
                      >
                        {unit}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={saveProfile}
                  className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all"
                >
                  Save Settings
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
