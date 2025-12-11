import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadFood } from '../utils/dataSync'
import { getDateKey } from '../utils/date'

export default function Food() {
  const navigate = useNavigate()
  const [foodData, setFoodData] = useState({ breakfast: [], lunch: [], dinner: [] })
  const [totals, setTotals] = useState({ calories: 0, protein: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const today = new Date()
      const dateKey = getDateKey(today)
      const data = await loadFood(dateKey)
      setFoodData(data)
      calculateTotals(data)
      setLoading(false)
    }
    load()
  }, [])

  const calculateTotals = (data) => {
    let calories = 0
    let protein = 0
    ;['breakfast', 'lunch', 'dinner'].forEach(meal => {
      (data[meal] || []).forEach(item => {
        calories += Number(item.calories) || 0
        protein += Number(item.protein) || 0
      })
    })
    setTotals({ calories, protein })
  }

  const mealIcons = {
    breakfast: '🌅',
    lunch: '☀️',
    dinner: '🌙'
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
      <div className="max-w-4xl mx-auto pt-4">
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
                    style={{ width: `${Math.min((totals.calories / 2000) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="text-orange-300/60 text-sm mt-2">Goal: 2000 cal</div>
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
                    style={{ width: `${Math.min((totals.protein / 150) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="text-blue-300/60 text-sm mt-2">Goal: 150g</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {['breakfast', 'lunch', 'dinner'].map(meal => (
            <div key={meal} className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">{mealIcons[meal]}</span>
                  <h2 className="text-3xl font-black text-white capitalize">{meal}</h2>
                </div>
                
                {foodData[meal]?.length > 0 ? (
                  <div className="space-y-3">
                    {foodData[meal].map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white/5 hover:bg-white/10 p-4 rounded-xl border border-white/10 transition-all">
                        <span className="font-semibold text-white text-lg">{item.name}</span>
                        <div className="flex gap-4 text-sm">
                          <span className="bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full border border-orange-500/30">
                            {item.calories} cal
                          </span>
                          <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-500/30">
                            {item.protein}g protein
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic text-center py-4">No items added yet</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate('/edit')}
          className="mt-8 w-full group relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-6 rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-105"
        >
          <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300"></div>
          <div className="relative z-10 flex items-center justify-center gap-3">
            <span className="text-2xl">➕</span>
            <span className="text-xl font-black">Add Food Items</span>
          </div>
        </button>
      </div>
    </div>
  )
}