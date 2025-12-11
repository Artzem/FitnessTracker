import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { loadWorkoutProgress, loadFood } from '../utils/dataSync'

export default function DayDetail() {
  const navigate = useNavigate()
  const { dateKey } = useParams()
  const [workout, setWorkout] = useState(null)
  const [food, setFood] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const workoutData = await loadWorkoutProgress(dateKey)
      const foodData = await loadFood(dateKey)
      setWorkout(workoutData)
      setFood(foodData)
      setLoading(false)
    }
    load()
  }, [dateKey])

  const formatDateString = (dateKey) => {
    const [year, month, day] = dateKey.split('-')
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    )
  }

  const totalCals = food?.items?.reduce((sum, item) => sum + (item.eaten ? Number(item.calories) || 0 : 0), 0) || 0
  const totalProtein = food?.items?.reduce((sum, item) => sum + (item.eaten ? Number(item.protein) || 0 : 0), 0) || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto pt-4 pb-8">
        <button
          onClick={() => navigate('/calendar')}
          className="group flex items-center gap-2 text-orange-400 hover:text-orange-300 font-semibold mb-8 transition-all"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          <span>Back to Calendar</span>
        </button>

        <div className="relative group mb-8">
          <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-red-600 rounded-3xl blur opacity-50"></div>
          <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8">
            <h1 className="text-4xl font-black text-white mb-2">{formatDateString(dateKey)}</h1>
            <p className="text-gray-400">Day Summary</p>
          </div>
        </div>

        {/* Workout Section */}
        {workout && workout.exercises ? (
          <div className="relative group mb-8">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-30"></div>
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-black text-white">{workout.workout}</h2>
                <span className="text-4xl">💪</span>
              </div>
              
              <div className="space-y-4">
                {workout.exercises.map((ex, idx) => (
                  <div key={idx} className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <h3 className="text-xl font-bold text-white mb-3">{ex.name}</h3>
                    <div className="space-y-2">
                      {ex.sets?.map((set, setIdx) => (
                        <div key={setIdx} className="flex items-center gap-4 text-sm">
                          <span className={`font-semibold ${set.completed ? 'text-green-400' : 'text-gray-400'}`}>
                            {set.completed ? '✓' : '○'} Set {setIdx + 1}
                          </span>
                          {set.weight && (
                            <span className="text-blue-300">{set.weight}</span>
                          )}
                          {set.reps && (
                            <span className="text-purple-300">{set.reps} reps</span>
                          )}
                          {set.notes && (
                            <span className="text-gray-400 italic">"{set.notes}"</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative group mb-8">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-gray-600 to-gray-700 rounded-2xl blur opacity-30"></div>
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-12 text-center">
              <div className="text-6xl mb-4">😴</div>
              <p className="text-gray-400 text-lg">No workout logged for this day</p>
            </div>
          </div>
        )}

        {/* Food Section */}
        {food && food.items && food.items.length > 0 ? (
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur opacity-30"></div>
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-black text-white">Nutrition</h2>
                <span className="text-4xl">🥗</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-orange-500/20 rounded-xl p-4 border border-orange-500/30">
                  <p className="text-orange-300 text-sm mb-1">Calories</p>
                  <p className="text-3xl font-black text-white">{totalCals}</p>
                </div>
                <div className="bg-blue-500/20 rounded-xl p-4 border border-blue-500/30">
                  <p className="text-blue-300 text-sm mb-1">Protein</p>
                  <p className="text-3xl font-black text-white">{totalProtein}g</p>
                </div>
              </div>

              <div className="space-y-2">
                {food.items.map((item, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-3 rounded-lg ${
                    item.eaten ? 'bg-green-500/10 border border-green-500/30' : 'bg-white/5 border border-white/10'
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{item.eaten ? '✓' : '○'}</span>
                      <span className="font-semibold text-white">{item.name}</span>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span className="text-orange-300">{item.calories} cal</span>
                      <span className="text-blue-300">{item.protein}g</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-gray-600 to-gray-700 rounded-2xl blur opacity-30"></div>
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-12 text-center">
              <div className="text-6xl mb-4">🍽️</div>
              <p className="text-gray-400 text-lg">No food logged for this day</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}