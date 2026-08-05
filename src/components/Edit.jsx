import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext' // ✅ Added Import
import { addOrMergeFoodLibraryItems, loadWorkouts, syncWorkouts, loadFoodList, syncFoodList, loadTrainingProfile, syncTrainingProfile } from '../utils/dataSync'
import { DEFAULT_PROFILE, getWorkoutOptions } from '../utils/workoutLogic'
import { GOAL_LABELS, EXPERIENCE_LABELS, EQUIPMENT_LABELS } from '../utils/planGenerator'

const WORKOUT_OPTIONS = getWorkoutOptions()

export default function Edit() {
  const navigate = useNavigate()
  const { currentUser } = useAuth() // ✅ Get current user
  
  const [tab, setTab] = useState('workouts')
  const [workouts, setWorkouts] = useState({})
  const [selectedWorkout, setSelectedWorkout] = useState('')
  const [editingExercise, setEditingExercise] = useState(null)
  const [draggedExercise, setDraggedExercise] = useState(null)
  const [profile, setProfile] = useState(DEFAULT_PROFILE)
  
  // Food state
  const [foodList, setFoodList] = useState([])
  const [newFoodItem, setNewFoodItem] = useState({ name: '', calories: '', protein: '', quantity: '1' })
  
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!currentUser) return // ✅ Wait for user
      
      // ✅ Pass currentUser.uid to load functions
      const data = await loadWorkouts(currentUser.uid)
      const foods = await loadFoodList(currentUser.uid)
      const trainingProfile = await loadTrainingProfile(currentUser.uid)
      
      const normalizedWorkouts = WORKOUT_OPTIONS.reduce((result, workoutName) => {
        result[workoutName] = data[workoutName] || []
        return result
      }, {})

      setWorkouts(normalizedWorkouts)
      setFoodList(foods)
      setProfile(trainingProfile)
      
      setSelectedWorkout(WORKOUT_OPTIONS[0])
      setLoading(false)
    }
    load()
  }, [currentUser]) // ✅ Reload when user is ready

  const saveWorkouts = async (next) => {
    if (!currentUser) return
    setWorkouts(next)
    // ✅ Pass currentUser.uid to save
    await syncWorkouts(currentUser.uid, next)
  }

  const addExercise = async () => {
    if (!selectedWorkout) return
    const newExercise = {
      name: 'New Exercise',
      sets: [
        { weight: '', reps: '10', completed: false, notes: '' },
        { weight: '', reps: '10', completed: false, notes: '' },
        { weight: '', reps: '10', completed: false, notes: '' }
      ]
    }
    const next = {
      ...workouts,
      [selectedWorkout]: [...(workouts[selectedWorkout] || []), newExercise]
    }
    await saveWorkouts(next)
    setEditingExercise({ workoutName: selectedWorkout, exerciseIdx: next[selectedWorkout].length - 1 })
  }

  const removeExercise = async (wName, idx) => {
    const next = { ...workouts }
    next[wName] = next[wName].filter((_, i) => i !== idx)
    await saveWorkouts(next)
    if (editingExercise?.exerciseIdx === idx) {
      setEditingExercise(null)
    }
  }

  const updateExerciseName = async (wName, idx, name) => {
    const next = { ...workouts }
    next[wName][idx].name = name
    await saveWorkouts(next)
  }

  const addSetToExercise = async (wName, idx) => {
    const next = { ...workouts }
    next[wName][idx].sets.push({ weight: '', reps: '10', completed: false, notes: '' })
    await saveWorkouts(next)
  }

  const removeSetFromExercise = async (wName, exIdx, setIdx) => {
    const next = { ...workouts }
    next[wName][exIdx].sets = next[wName][exIdx].sets.filter((_, i) => i !== setIdx)
    await saveWorkouts(next)
  }

  const updateSet = async (wName, exIdx, setIdx, field, value) => {
    const next = { ...workouts }
    next[wName][exIdx].sets[setIdx][field] = value
    await saveWorkouts(next)
  }

  // Drag and drop handlers
  const handleDragStart = (e, idx) => {
    setDraggedExercise(idx)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e, dropIdx) => {
    e.preventDefault()
    if (draggedExercise === null || draggedExercise === dropIdx) return

    const next = { ...workouts }
    const exercises = [...next[selectedWorkout]]
    const [removed] = exercises.splice(draggedExercise, 1)
    exercises.splice(dropIdx, 0, removed)
    next[selectedWorkout] = exercises

    await saveWorkouts(next)
    setDraggedExercise(null)
  }

  const handleDragEnd = () => {
    setDraggedExercise(null)
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
    // ✅ Pass currentUser.uid to save
    await syncFoodList(currentUser.uid, updated)
  }

  const updateProfileField = (field, value) => {
    const numericFields = ['age', 'heightFeet', 'heightInches', 'bodyweight', 'daysPerWeek', 'calorieGoal', 'proteinGoal', 'preferredWaterGoal']
    const nextValue = numericFields.includes(field) ? Number(value || 0) : value
    setProfile((current) => ({ ...current, [field]: nextValue }))
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
      <div className="max-w-6xl mx-auto pt-4 pb-8">
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
                  tab === 'workouts' ? 'text-white' : 'text-gray-400 hover:text-gray-300'
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
                  tab === 'food' ? 'text-white' : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab === 'food' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600"></div>
                )}
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span className="text-2xl">🥗</span>
                  <span>Food Library</span>
                </span>
              </button>
              <button
                onClick={() => setTab('profile')}
                className={`flex-1 py-6 font-bold text-lg transition-all relative ${
                  tab === 'profile' ? 'text-white' : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab === 'profile' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600"></div>
                )}
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span className="text-2xl">📋</span>
                  <span>Profile</span>
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
                        onChange={(e) => {
                          setSelectedWorkout(e.target.value)
                          setEditingExercise(null)
                        }}
                        className="flex-1 p-4 bg-white/5 border border-white/20 rounded-xl text-white font-semibold focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                      >
                        {WORKOUT_OPTIONS.map((w) => (
                          <option key={w} className="bg-slate-900">{w}</option>
                        ))}
                      </select>
                    </div>
                    <p className="text-sm text-gray-400">This app now uses only the three workout buckets: Push, Pull, and Legs.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Exercise List */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-black text-2xl text-white">Exercises</h3>
                        <button
                          onClick={addExercise}
                          className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-lg font-semibold transition-all"
                        >
                          ➕ Add Exercise
                        </button>
                      </div>
                      <div className="space-y-3">
                        {(workouts[selectedWorkout] || []).map((ex, idx) => (
                          <div
                            key={idx}
                            draggable
                            onDragStart={(e) => handleDragStart(e, idx)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, idx)}
                            onDragEnd={handleDragEnd}
                            className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-move ${
                              editingExercise?.exerciseIdx === idx
                                ? 'bg-blue-500/20 border-blue-500/50'
                                : draggedExercise === idx
                                ? 'bg-white/20 border-white/40 opacity-50'
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <span className="text-gray-400 text-xl cursor-grab active:cursor-grabbing">⋮⋮</span>
                              <div>
                                <p className="font-bold text-white text-lg">{ex.name}</p>
                                <p className="text-sm text-gray-400">{ex.sets?.length || 0} sets</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingExercise({ workoutName: selectedWorkout, exerciseIdx: idx })}
                                className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-all"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => removeExercise(selectedWorkout, idx)}
                                className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-all"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Exercise Editor */}
                    <div className="space-y-4">
                      {editingExercise ? (
                        <>
                          <div className="flex items-center justify-between">
                            <h3 className="font-black text-2xl text-white">Edit Exercise</h3>
                            <button
                              onClick={() => setEditingExercise(null)}
                              className="text-gray-400 hover:text-white"
                            >
                              ✕
                            </button>
                          </div>
                          
                          <input
                            type="text"
                            value={workouts[editingExercise.workoutName][editingExercise.exerciseIdx].name}
                            onChange={(e) => updateExerciseName(editingExercise.workoutName, editingExercise.exerciseIdx, e.target.value)}
                            className="w-full p-4 bg-white/5 border border-white/20 rounded-xl text-white font-bold text-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Exercise name"
                          />

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-white">Sets</h4>
                              <button
                                onClick={() => addSetToExercise(editingExercise.workoutName, editingExercise.exerciseIdx)}
                                className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30 rounded-lg text-sm font-semibold transition-all"
                              >
                                ➕ Add Set
                              </button>
                            </div>
                            
                            {workouts[editingExercise.workoutName][editingExercise.exerciseIdx].sets.map((set, setIdx) => (
                              <div key={setIdx} className="bg-white/5 rounded-lg p-4 border border-white/10">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="font-bold text-white">Set {setIdx + 1}</span>
                                  <button
                                    onClick={() => removeSetFromExercise(editingExercise.workoutName, editingExercise.exerciseIdx, setIdx)}
                                    className="text-red-400 hover:text-red-300 text-sm"
                                  >
                                    Remove
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <input
                                    type="text"
                                    value={set.weight}
                                    onChange={(e) => updateSet(editingExercise.workoutName, editingExercise.exerciseIdx, setIdx, 'weight', e.target.value)}
                                    placeholder="Weight (e.g., 135 lbs)"
                                    className="p-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                  />
                                  <input
                                    type="text"
                                    value={set.reps}
                                    onChange={(e) => updateSet(editingExercise.workoutName, editingExercise.exerciseIdx, setIdx, 'reps', e.target.value)}
                                    placeholder="Reps (e.g., 10)"
                                    className="p-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                  />
                                </div>
                                <input
                                  type="text"
                                  value={set.notes}
                                  onChange={(e) => updateSet(editingExercise.workoutName, editingExercise.exerciseIdx, setIdx, 'notes', e.target.value)}
                                  placeholder="Notes (optional)"
                                  className="mt-3 w-full p-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-full min-h-[300px] text-gray-500">
                          <div className="text-center">
                            <div className="text-6xl mb-4">✏️</div>
                            <p>Select an exercise to edit</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
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

              {tab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-black text-2xl text-white">Training Profile</h3>
                    <p className="text-gray-400 mt-2">
                      Your profile drives starting weights, calorie targets, and the adaptive progression algorithm.
                    </p>
                  </div>

                  {/* Personal */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-cyan-300 uppercase tracking-wider mb-2">Name</label>
                      <input
                        type="text"
                        value={profile.name || ''}
                        onChange={(e) => updateProfileField('name', e.target.value)}
                        placeholder="Your name"
                        className="w-full p-4 bg-white/5 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-cyan-300 uppercase tracking-wider mb-2">Age</label>
                      <input
                        type="number"
                        value={profile.age}
                        onChange={(e) => updateProfileField('age', e.target.value)}
                        className="w-full p-4 bg-white/5 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-cyan-300 uppercase tracking-wider mb-2">Sex</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['Male', 'Female', 'Other'].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => updateProfileField('sex', s)}
                            className={`py-4 rounded-xl font-semibold transition-all ${
                              profile.sex === s
                                ? 'bg-cyan-500/30 border-2 border-cyan-400 text-cyan-200'
                                : 'bg-white/5 border-2 border-white/10 text-gray-300 hover:border-white/30'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-cyan-300 uppercase tracking-wider mb-2">Current Weight (lb)</label>
                      <input
                        type="number"
                        value={profile.bodyweight}
                        onChange={(e) => updateProfileField('bodyweight', e.target.value)}
                        className="w-full p-4 bg-white/5 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-cyan-300 uppercase tracking-wider mb-2">Height (ft)</label>
                      <input
                        type="number"
                        value={profile.heightFeet}
                        onChange={(e) => updateProfileField('heightFeet', e.target.value)}
                        className="w-full p-4 bg-white/5 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-cyan-300 uppercase tracking-wider mb-2">Height (in)</label>
                      <input
                        type="number"
                        value={profile.heightInches}
                        onChange={(e) => updateProfileField('heightInches', e.target.value)}
                        className="w-full p-4 bg-white/5 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Training */}
                  <div className="border-t border-white/10 pt-6 space-y-4">
                    <h4 className="font-bold text-white text-lg">Training Settings</h4>

                    <div>
                      <label className="block text-sm font-bold text-cyan-300 uppercase tracking-wider mb-2">Primary Goal</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                        {Object.entries(GOAL_LABELS).map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => updateProfileField('goal', value)}
                            className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                              profile.goal === value
                                ? 'bg-cyan-500/30 border-2 border-cyan-400 text-cyan-200'
                                : 'bg-white/5 border-2 border-white/10 text-gray-300 hover:border-white/30'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-cyan-300 uppercase tracking-wider mb-2">Experience Level</label>
                      <div className="grid grid-cols-3 gap-2">
                        {Object.entries(EXPERIENCE_LABELS).map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => updateProfileField('experience', value)}
                            className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                              profile.experience === value
                                ? 'bg-cyan-500/30 border-2 border-cyan-400 text-cyan-200'
                                : 'bg-white/5 border-2 border-white/10 text-gray-300 hover:border-white/30'
                            }`}
                          >
                            {label.split(' ')[0]}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-cyan-300 uppercase tracking-wider mb-2">Available Equipment</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {Object.entries(EQUIPMENT_LABELS).map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => updateProfileField('equipment', value)}
                            className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                              profile.equipment === value
                                ? 'bg-cyan-500/30 border-2 border-cyan-400 text-cyan-200'
                                : 'bg-white/5 border-2 border-white/10 text-gray-300 hover:border-white/30'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-cyan-300 uppercase tracking-wider mb-2">Training Days per Week</label>
                      <div className="grid grid-cols-4 gap-2">
                        {[3, 4, 5, 6].map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => updateProfileField('daysPerWeek', d)}
                            className={`py-4 rounded-xl font-black text-xl transition-all ${
                              profile.daysPerWeek === d
                                ? 'bg-cyan-500/30 border-2 border-cyan-400 text-cyan-200'
                                : 'bg-white/5 border-2 border-white/10 text-gray-300 hover:border-white/30'
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Nutrition targets */}
                  <div className="border-t border-white/10 pt-6 space-y-4">
                    <h4 className="font-bold text-white text-lg">Nutrition Targets</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-cyan-300 uppercase tracking-wider mb-2">Daily Calories</label>
                        <input
                          type="number"
                          value={profile.calorieGoal || 2000}
                          onChange={(e) => updateProfileField('calorieGoal', e.target.value)}
                          className="w-full p-4 bg-white/5 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-cyan-300 uppercase tracking-wider mb-2">Daily Protein (g)</label>
                        <input
                          type="number"
                          value={profile.proteinGoal || 130}
                          onChange={(e) => updateProfileField('proteinGoal', e.target.value)}
                          className="w-full p-4 bg-white/5 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-cyan-300 uppercase tracking-wider mb-2">Daily Water (bottles)</label>
                        <input
                          type="number"
                          min="1"
                          max="15"
                          value={profile.preferredWaterGoal || 5}
                          onChange={(e) => updateProfileField('preferredWaterGoal', e.target.value)}
                          className="w-full p-4 bg-white/5 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Limitations */}
                  <div className="border-t border-white/10 pt-6">
                    <label className="block text-sm font-bold text-cyan-300 uppercase tracking-wider mb-2">Injuries / Limitations</label>
                    <textarea
                      rows={3}
                      value={profile.limitations || ''}
                      onChange={(e) => updateProfileField('limitations', e.target.value)}
                      placeholder="e.g. bad left knee, shoulder impingement"
                      className="w-full p-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 outline-none resize-none"
                    />
                  </div>

                  <button
                    onClick={saveProfile}
                    className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all"
                  >
                    Save Profile
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
