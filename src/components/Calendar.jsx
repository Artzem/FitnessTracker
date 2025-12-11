import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadAllWorkoutProgress, loadAllFoodProgress } from '../utils/dataSync'
import { getDateKey } from '../utils/date'

export default function Calendar() {
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [workoutProgress, setWorkoutProgress] = useState({})
  const [foodProgress, setFoodProgress] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const workouts = await loadAllWorkoutProgress()
        const foods = await loadAllFoodProgress()
        setWorkoutProgress(workouts || {})
        setFoodProgress(foods || {})
      } catch (error) {
        console.error('Error loading calendar data:', error)
        setWorkoutProgress({})
        setFoodProgress({})
      }
      setLoading(false)
    }
    load()
  }, [])

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    return { daysInMonth, startingDayOfWeek, year, month }
  }

  const changeMonth = (delta) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1))
  }

  const getProgressForDate = (dateKey) => {
    const workout = workoutProgress[dateKey]
    const food = foodProgress[dateKey]
    
    let workoutPercent = 0
    let foodPercent = 0
    
    if (workout && workout.exercises && Array.isArray(workout.exercises)) {
      let totalSets = 0
      let completedSets = 0
      workout.exercises.forEach(ex => {
        if (ex.sets && Array.isArray(ex.sets)) {
          ex.sets.forEach(set => {
            totalSets++
            if (set.completed) completedSets++
          })
        }
      })
      workoutPercent = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0
    }
    
    if (food && food.items && Array.isArray(food.items)) {
      const totalCals = food.items.reduce((sum, item) => sum + (item.eaten ? Number(item.calories) || 0 : 0), 0)
      const goal = food.calorieGoal || 2000
      foodPercent = Math.min(Math.round((totalCals / goal) * 100), 100)
    }
    
    return { workoutPercent, foodPercent, workout, food }
  }

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate)
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto pt-4 pb-8">
        <button
          onClick={() => navigate('/')}
          className="group flex items-center gap-2 text-orange-400 hover:text-orange-300 font-semibold mb-8 transition-all"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          <span>Back to Home</span>
        </button>

        <div className="relative group mb-8">
          <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-red-600 rounded-3xl blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
          <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => changeMonth(-1)}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
              >
                <span className="text-white text-2xl font-bold">←</span>
              </button>
              <h1 className="text-4xl font-black text-white">
                {monthNames[month]} {year}
              </h1>
              <button
                onClick={() => changeMonth(1)}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
              >
                <span className="text-white text-2xl font-bold">→</span>
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-center text-gray-400 font-bold text-sm py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square"></div>
              ))}
              
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const date = new Date(year, month, day)
                const dateKey = getDateKey(date)
                const { workoutPercent, foodPercent, workout } = getProgressForDate(dateKey)
                const isToday = dateKey === getDateKey(new Date())
                
                return (
                  <button
                    key={day}
                    onClick={() => navigate(`/day/${dateKey}`)}
                    className={`aspect-square relative overflow-hidden rounded-xl transition-all hover:scale-105 ${
                      isToday 
                        ? 'bg-gradient-to-br from-orange-500/30 to-red-500/30 border-2 border-orange-400' 
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="absolute inset-0 p-2 flex flex-col">
                      <div className="text-white font-bold text-lg mb-auto">{day}</div>
                      
                      {workout && workout.workout && (
                        <div className="text-xs text-gray-400 mb-1 truncate">
                          {workout.workout}
                        </div>
                      )}
                      
                      {/* Progress bars */}
                      <div className="space-y-1">
                        {workoutPercent > 0 && (
                          <div className="w-full bg-black/30 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-cyan-500 h-1.5 rounded-full"
                              style={{ width: `${workoutPercent}%` }}
                            ></div>
                          </div>
                        )}
                        
                        {foodPercent > 0 && (
                          <div className="w-full bg-black/30 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-green-500 to-emerald-500 h-1.5 rounded-full"
                              style={{ width: `${foodPercent}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
                <span className="text-gray-400">Workout</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                <span className="text-gray-400">Food</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}