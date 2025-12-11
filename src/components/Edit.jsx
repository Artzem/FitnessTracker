import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadWorkouts, syncWorkouts, loadFood, syncFood } from '../utils/dataSync'
import { getDateKey } from '../utils/date'

export default function Edit() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('workouts')
  const [workouts, setWorkouts] = useState({})
  const [selectedWorkout, setSelectedWorkout] = useState('')
  const [newWorkoutName, setNewWorkoutName] = useState('')
  const [newExercise, setNewExercise] = useState({ name: '', weight: '', totalSets: 3, reps: '10', completedSets: [] })
  const [selectedMeal, setSelectedMeal] = useState('breakfast')
  const [newFood, setNewFood] = useState({ name: '', calories: '', protein: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const data = await loadWorkouts()
      setWorkouts(data)
      if (Object.keys(data).length > 0) {
        setSelectedWorkout(Object.keys(data)[0])
      }
      setLoading(false)
    }
    load()
  }, [])

  const saveWorkouts = async (next) => {
    setWorkouts(next)
    await syncWorkouts(next)
  }

  const addWorkout = async () => {
    if (!newWorkoutName.trim() || workouts[newWorkoutName]) return
    const next = { ...workouts, [newWorkoutName]: [] }
    await saveWorkouts(next)
    setSelectedWorkout(newWorkoutName)
    setNewWorkoutName('')
  }

  const removeWorkout = async (name) => {
    const next = { ...workouts }
    delete next[name]
    await saveWorkouts(next)
    setSelectedWorkout(Object.keys(next)[0] || '')
  }

  const addExercise = async () => {
    if (!newExercise.name.trim() || !selectedWorkout) return
    const next = {
      ...workouts,
      [selectedWorkout]: [...(workouts[selectedWorkout] || []), { ...newExercise, completedSets: [] }]
    }
    await saveWorkouts(next)
    setNewExercise({ name: '', weight: '', totalSets: 3, reps: '10', completedSets: [] })
  }

  const removeExercise = async (wName, idx) => {
    const next = { ...workouts }
    next[wName] = next[wName].filter((_, i) => i !== idx)
    await saveWorkouts(next)
  }

  const addFoodItem = async () => {
    if (!newFood.name.trim()) return
    const today = new Date()
    const dateKey = getDateKey(today)
    const currentData = await loadFood(dateKey)
    
    currentData[selectedMeal] = [...(currentData[selectedMeal] || []), newFood]
    await syncFood(dateKey, currentData)
    setNewFood({ name: '', calories: '', protein: '' })
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
      <div className="max-w-4xl mx-auto pt-4 pb-8">
        <button
          onClick={() => navigate('/')}
          className="group flex items-center gap-2 text-purple-400 hover:text-purple-300 font-semibold mb-8 transition-all"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          <span>Back to Home</span>
        </button>

        <div className="relative group mb-8">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
          <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
            <div className="flex border-b border-white/10">
              <button
                onClick={() => setTab('workouts')}
                className={`flex-1 py-6 font-bold text-lg transition-all relative ${
                  tab === 'workouts' 
                    ? 'text-white' 
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab === 'workouts' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600"></div>
                )}
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span className="text-2xl">💪</span>
                  <span>Workouts</span>
                </span>
              </button>
              <button
                onClick={() => setTab('food')}
                className={`flex-1 py-6 font-bold text-lg transition-all relative ${
                  tab === 'food' 
                    ? 'text-white' 
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab === 'food' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600"></div>
                )}
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span className="text-2xl">🥗</span>
                  <span>Food</span>
                </span>
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-8">
              {tab === 'workouts' && (
                <>
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-purple-300 uppercase tracking-wider">Select Workout</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <select
                        value={selectedWorkout}
                        onChange={(e) => setSelectedWorkout(e.target.value)}
                        className="flex-1 p-4 bg-white/5 border border-white/20 rounded-xl text-white font-semibold focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                      >
                        {Object.keys(workouts).map((w) => (
                          <option key={w} className="bg-slate-900">{w}</option>
                        ))}
                      </select>
                      {selectedWorkout && (
                        <button
                          onClick={() => removeWorkout(selectedWorkout)}
                          className="px-6 py-4 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-xl font-semibold transition-all"
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={newWorkoutName}
                        onChange={(e) => setNewWorkoutName(e.target.value)}
                        placeholder="New workout name"
                        className="flex-1 p-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 font-medium focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                      />
                      <button
                        onClick={addWorkout}
                        className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-bold transition-all"
                      >
                        ➕ Add
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-black text-2xl text-white">Exercises</h3>
                    <div className="space-y-3">
                      {(workouts[selectedWorkout] || []).map((ex, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white/5 hover:bg-white/10 p-5 rounded-xl border border-white/10 transition-all group">
                          <div className="flex-1">
                            <p className="font-bold text-white text-lg mb-1">{ex.name}</p>
                            <div className="flex gap-3 text-sm">
                              <span className="text-purple-300">📊 {ex.totalSets} sets × {ex.reps} reps</span>
                              {ex.weight && <span className="text-blue-300">⚡ {ex.weight}</span>}
                            </div>
                          </div>
                          <button
                            onClick={() => removeExercise(selectedWorkout, idx)}
                            className="text-red-400 hover:text-red-300 font-semibold opacity-0 group-hover:opacity-100 transition-all"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-8 space-y-4">
                    <h3 className="font-black text-2xl text-white">Add Exercise</h3>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={newExercise.name}
                        onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                        placeholder="Exercise name"
                        className="w-full p-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input
                          type="number"
                          value={newExercise.totalSets}
                          onChange={(e) => setNewExercise({ ...newExercise, totalSets: parseInt(e.target.value) || 3 })}
                          placeholder="Sets"
                          min="1"
                          max="10"
                          className="p-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                        <input
                          type="text"
                          value={newExercise.reps}
                          onChange={(e) => setNewExercise({ ...newExercise, reps: e.target.value })}
                          placeholder="Reps (e.g., 10 or 8-12)"
                          className="p-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                        <input
                          type="text"
                          value={newExercise.weight}
                          onChange={(e) => setNewExercise({ ...newExercise, weight: e.target.value })}
                          placeholder="Weight (optional)"
                          className="p-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                      <button
                        onClick={addExercise}
                        className="w-full py-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-lg rounded-xl transition-all transform hover:scale-105 shadow-lg"
                      >
                        ➕ Add Exercise
                      </button>
                    </div>
                  </div>
                </>
              )}

              {tab === 'food' && (
                <>
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-green-300 uppercase tracking-wider">Select Meal</label>
                    <select
                      value={selectedMeal}
                      onChange={(e) => setSelectedMeal(e.target.value)}
                      className="w-full p-4 bg-white/5 border border-white/20 rounded-xl text-white font-semibold focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                    >
                      <option value="breakfast" className="bg-slate-900">🌅 Breakfast</option>
                      <option value="lunch" className="bg-slate-900">☀️ Lunch</option>
                      <option value="dinner" className="bg-slate-900">🌙 Dinner</option>
                    </select>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-black text-2xl text-white">Add Food Item</h3>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={newFood.name}
                        onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
                        placeholder="Food name"
                        className="w-full p-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 font-medium focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="number"
                          value={newFood.calories}
                          onChange={(e) => setNewFood({ ...newFood, calories: e.target.value })}
                          placeholder="Calories"
                          className="p-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 font-medium focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                        />
                        <input
                          type="number"
                          value={newFood.protein}
                          onChange={(e) => setNewFood({ ...newFood, protein: e.target.value })}
                          placeholder="Protein (g)"
                          className="p-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 font-medium focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                      <button
                        onClick={addFoodItem}
                        className="w-full py-5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-black text-lg rounded-xl transition-all transform hover:scale-105 shadow-lg"
                      >
                        ➕ Add Food Item
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}