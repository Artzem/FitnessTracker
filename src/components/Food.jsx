import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadFood, syncFood, loadFoodList } from '../utils/dataSync'
import { getDateKey } from '../utils/date'

export default function Food() {
  const navigate = useNavigate()
  const [foodData, setFoodData] = useState({ items: [], calorieGoal: 2000, proteinGoal: 150 })
  const [foodLibrary, setFoodLibrary] = useState([])
  const [totals, setTotals] = useState({ calories: 0, protein: 0 })
  const [loading, setLoading] = useState(true)
  const [showAddFood, setShowAddFood] = useState(false)

  useEffect(() => {
    const load = async () => {
      const today = new Date()
      const dateKey = getDateKey(today)
      const data = await loadFood(dateKey)
      const library = await loadFoodList()
      setFoodData(data)
      setFoodLibrary(library)
      calculateTotals(data)
      setLoading(false)
    }
    load()
  }, [])

  const calculateTotals = (data) => {
    let calories = 0
    let protein = 0
    
    if (data.items) {
      data.items.forEach(item => {
        if (item.eaten) {
          calories += Number(item.calories) || 0
          protein += Number(item.protein) || 0
        }
      })
    }
    
    setTotals({ calories, protein })
  }

  const toggleFood = async (idx) => {
    const updated = { ...foodData }
    updated.items[idx].eaten = !updated.items[idx].eaten
    setFoodData(updated)
    calculateTotals(updated)
    
    const today = new Date()
    const dateKey = getDateKey(today)
    await syncFood(dateKey, updated)
  }

  const addFoodFromLibrary = async (food) => {
    const updated = { ...foodData }
    updated.items.push({ ...food, eaten: false })
    setFoodData(updated)
    
    const today = new Date()
    const dateKey = getDateKey(today)
    await syncFood(dateKey, updated)
    setShowAddFood(false)
  }

  const removeFoodItem = async (idx) => {
    const updated = { ...foodData }
    updated.items = updated.items.filter((_, i) => i !== idx)
    setFoodData(updated)
    calculateTotals(updated)
    
    const today = new Date()
    const dateKey = getDateKey(today)
    await syncFood(dateKey, updated)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto pt-4 pb-8">
        <button
          onClick={() => navigate('/')}
          className="group flex items-center gap-2 text-green-400 hover:text-green-300 font-semibold mb-8 transition-all"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          <span>Back to Home</span>
        </button>

        <div className="relative group mb-8">
          <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
          <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-5xl font-black text-white">Nutrition</h1>
              <div className="text-6xl">🥗</div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 p-6 border border-orange-500/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-orange-300 font-semibold uppercase text-sm tracking-wider">Calories</span>
                  <span className="text-3xl">🔥</span>
                </div>
                <div className="text-5xl font-black text-white mb-3">{totals.calories}</div>
                <div className="w-full bg-black/30 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all duration-1000 ease-out shadow-lg"
                    style={{ width: `${Math.min((totals.calories / foodData.calorieGoal) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="text-orange-300/60 text-sm mt-2">Goal: {foodData.calorieGoal} cal</div>
              </div>
              
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-6 border border-blue-500/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-blue-300 font-semibold uppercase text-sm tracking-wider">Protein</span>
                  <span className="text-3xl">💪</span>
                </div>
                <div className="text-5xl font-black text-white mb-3">{totals.protein}<span className="text-2xl ml-1">g</span></div>
                <div className="w-full bg-black/30 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-1000 ease-out shadow-lg"
                    style={{ width: `${Math.min((totals.protein / foodData.proteinGoal) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="text-blue-300/60 text-sm mt-2">Goal: {foodData.proteinGoal}g</div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative group mb-8">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl blur opacity-20"></div>
          <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-3xl font-black text-white">Today's Food</h2>
              <button
                onClick={() => setShowAddFood(!showAddFood)}
                className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30 rounded-lg font-semibold transition-all"
              >
                {showAddFood ? '✕ Close' : '➕ Add Food'}
              </button>
            </div>

            {showAddFood && (
              <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                <h3 className="font-bold text-white mb-3">Select from Library</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                  {foodLibrary.map((food, idx) => (
                    <button
                      key={idx}
                      onClick={() => addFoodFromLibrary(food)}
                      className="text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all"
                    >
                      <p className="font-semibold text-white">{food.name}</p>
                      <p className="text-sm text-gray-400">{food.calories} cal • {food.protein}g</p>
                    </button>
                  ))}
                </div>
                {foodLibrary.length === 0 && (
                  <div className="text-center py-6">
                    <p className="text-gray-400 mb-3">No foods in library yet</p>
                    <button
                      onClick={() => navigate('/edit')}
                      className="text-green-400 hover:text-green-300 underline"
                    >
                      Add foods to library →
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {foodData.items && foodData.items.length > 0 ? (
              <div className="space-y-3">
                {foodData.items.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                      item.eaten
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={item.eaten}
                      onChange={() => toggleFood(idx)}
                      className="w-6 h-6 rounded border-2 border-white/30 bg-white/10 checked:bg-green-500 checked:border-green-500 cursor-pointer transition-all"
                    />
                    <div className="flex-1">
                      <span className={`font-semibold text-lg ${item.eaten ? 'text-green-300' : 'text-white'}`}>
                        {item.name}
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span className="bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full border border-orange-500/30">
                        {item.calories} cal
                      </span>
                      <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-500/30">
                        {item.protein}g
                      </span>
                    </div>
                    <button
                      onClick={() => removeFoodItem(idx)}
                      className="text-red-400 hover:text-red-300 transition-all"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic text-center py-8">No food items added yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}