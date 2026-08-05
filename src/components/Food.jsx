import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { addOrMergeFoodLibraryItems, loadFood, syncFood, loadFoodList, loadTrainingProfile, syncTrainingProfile } from '../utils/dataSync'
import { getDateKey } from '../utils/date'

const MEALS = ['breakfast', 'lunch', 'dinner']

const EMPTY_FOOD_DATA = {
  breakfast: [],
  lunch: [],
  dinner: [],
  calorieGoal: 2000,
  proteinGoal: 150,
  carbGoal: 250,
  fatGoal: 65,
  sodiumGoal: 2300,
  sugarGoal: 50
}

const getMealByTime = () => {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 13) return 'breakfast'
  if (hour >= 13 && hour < 19) return 'lunch'
  return 'dinner'
}

const normalizeFoodItem = (item = {}) => ({
  ...item,
  calories: Math.round(Number(item.calories) || 0),
  protein: Math.round(Number(item.protein) || 0),
  carbs: Math.round(Number(item.carbs) || 0),
  fat: Math.round(Number(item.fat) || 0),
  sodium: Math.round(Number(item.sodium) || 0),
  sugar: Math.round(Number(item.sugar) || 0),
  quantity: Math.max(1, Number(item.quantity) || 1),
  eaten: Boolean(item.eaten)
})

const compressImage = (file, maxPx = 1200, quality = 0.75) =>
  new Promise((resolve, reject) => {
    const img = new Image()
    const blobUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(blobUrl)
      let { width, height } = img
      if (width > maxPx || height > maxPx) {
        if (width >= height) { height = Math.round(height * maxPx / width); width = maxPx }
        else { width = Math.round(width * maxPx / height); height = maxPx }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => reject(new Error('Could not load image for compression.'))
    img.src = blobUrl
  })

const getFriendlyPhotoError = (message = '') => {
  if (message.includes('OPENAI_API_KEY')) {
    return 'AI food logging is not configured yet because the OpenAI key is missing.'
  }
  if (message.includes('did not match the expected pattern')) {
    return 'Too many or too large photos. Try fewer photos or shorter descriptions.'
  }
  return message || 'Could not analyze the food.'
}

const getDisplayPortion = (item) => {
  if (!item?.portion) return item.quantity > 1 ? `${item.quantity}x` : ''
  return item.quantity > 1 ? `${item.quantity}x ${item.portion}` : item.portion
}

export default function Food() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()

  const [foodData, setFoodData] = useState(EMPTY_FOOD_DATA)
  const [foodLibrary, setFoodLibrary] = useState([])
  const [totals, setTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0, sugar: 0 })
  const [trainingProfile, setTrainingProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAddFood, setShowAddFood] = useState(false)
  const [selectedMeal, setSelectedMeal] = useState(getMealByTime)
  const [selectedPhotos, setSelectedPhotos] = useState([])
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false)
  const [photoSummary, setPhotoSummary] = useState('')
  const [photoSuggestions, setPhotoSuggestions] = useState([])
  const [photoError, setPhotoError] = useState('')
  const [photoContext, setPhotoContext] = useState('')
  const [photoRejected, setPhotoRejected] = useState(false)
  const [expandedItems, setExpandedItems] = useState(new Set())
  const [editingKey, setEditingKey] = useState(null)
  const [editValues, setEditValues] = useState({})
  const [comboName, setComboName] = useState('')
  const [showComboSave, setShowComboSave] = useState(false)
  const [selectedLibraryItems, setSelectedLibraryItems] = useState(new Set())
  const [saveToLibrary, setSaveToLibrary] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!currentUser) return

      const today = new Date()
      const dateKey = getDateKey(today)
      const [data, library, profile] = await Promise.all([
        loadFood(currentUser.uid, dateKey),
        loadFoodList(currentUser.uid),
        loadTrainingProfile(currentUser.uid),
      ])

      setTrainingProfile(profile)

      const merged = {
        ...EMPTY_FOOD_DATA,
        calorieGoal: profile?.calorieGoal  || EMPTY_FOOD_DATA.calorieGoal,
        proteinGoal: profile?.proteinGoal  || EMPTY_FOOD_DATA.proteinGoal,
        carbGoal:    profile?.carbGoal     || EMPTY_FOOD_DATA.carbGoal,
        fatGoal:     profile?.fatGoal      || EMPTY_FOOD_DATA.fatGoal,
        sodiumGoal:  profile?.sodiumGoal   || EMPTY_FOOD_DATA.sodiumGoal,
        sugarGoal:   profile?.sugarGoal    || EMPTY_FOOD_DATA.sugarGoal,
        ...(data || {}),
      }

      MEALS.forEach((meal) => {
        merged[meal] = (merged[meal] || []).map(normalizeFoodItem)
      })

      setFoodData(merged)
      setFoodLibrary((library || []).map(normalizeFoodItem))
      calculateTotals(merged)
      setLoading(false)
    }

    load()
  }, [currentUser])

  const calculateTotals = (data) => {
    let calories = 0, protein = 0, carbs = 0, fat = 0, sodium = 0, sugar = 0

    MEALS.forEach((meal) => {
      ;(data[meal] || []).forEach((item) => {
        if (item.eaten) {
          calories += Number(item.calories) || 0
          protein += Number(item.protein) || 0
          carbs += Number(item.carbs) || 0
          fat += Number(item.fat) || 0
          sodium += Number(item.sodium) || 0
          sugar += Number(item.sugar) || 0
        }
      })
    })

    setTotals({
      calories: Math.round(calories),
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fat: Math.round(fat),
      sodium: Math.round(sodium),
      sugar: Math.round(sugar),
    })
  }

  const persistFood = async (updated) => {
    if (!currentUser) return
    const today = new Date()
    const dateKey = getDateKey(today)
    await syncFood(currentUser.uid, dateKey, updated)
  }

  const toggleFood = async (meal, idx) => {
    if (!currentUser) return
    const updated = { ...foodData }
    updated[meal] = [...updated[meal]]
    updated[meal][idx] = { ...updated[meal][idx], eaten: !updated[meal][idx].eaten }
    setFoodData(updated)
    calculateTotals(updated)
    await persistFood(updated)
  }

  const addFoodToMeal = async (items) => {
    if (!currentUser || !items?.length) return
    const updated = {
      ...foodData,
      [selectedMeal]: [...(foodData[selectedMeal] || []), ...items.map((item) => ({ ...normalizeFoodItem(item), eaten: false }))]
    }
    setFoodData(updated)
    calculateTotals(updated)
    await persistFood(updated)

    const todayKey = getDateKey(new Date())
    if (trainingProfile && trainingProfile.lastFoodLogDate !== todayKey) {
      const updatedProfile = { ...trainingProfile, lastFoodLogDate: todayKey }
      setTrainingProfile(updatedProfile)
      await syncTrainingProfile(currentUser.uid, updatedProfile)
    }
  }

  const toggleLibrarySelection = (idx) => {
    setSelectedLibraryItems((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const addSelectedFromLibrary = async () => {
    const items = [...selectedLibraryItems].map((idx) => foodLibrary[idx]).filter(Boolean)
    if (!items.length) return
    await addFoodToMeal(items)
    if (currentUser) {
      const updatedLibrary = await addOrMergeFoodLibraryItems(currentUser.uid, items, { source: 'library', incrementUsage: true })
      setFoodLibrary(updatedLibrary)
    }
    setSelectedLibraryItems(new Set())
    setShowAddFood(false)
  }

  const removeFoodItem = async (meal, idx) => {
    if (!currentUser) return
    const updated = { ...foodData }
    updated[meal] = updated[meal].filter((_, i) => i !== idx)
    setFoodData(updated)
    calculateTotals(updated)
    await persistFood(updated)
  }

  const toggleItemExpanded = (key) => {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const startEdit = (meal, idx) => {
    setEditingKey(`${meal}-${idx}`)
    setEditValues({ ...foodData[meal][idx] })
  }

  const cancelEdit = () => {
    setEditingKey(null)
    setEditValues({})
  }

  const saveEdit = async (meal, idx) => {
    const updated = { ...foodData }
    updated[meal] = [...updated[meal]]
    updated[meal][idx] = normalizeFoodItem({ ...editValues })
    setFoodData(updated)
    calculateTotals(updated)
    await persistFood(updated)
    setEditingKey(null)
    setEditValues({})
  }

  const saveAsCombo = async () => {
    if (!photoSuggestions.length || photoRejected) return
    const name = comboName.trim() || photoSuggestions.map((i) => i.name).join(', ')
    const combo = normalizeFoodItem({
      name,
      portion: `${photoSuggestions.length} items combined`,
      quantity: 1,
      calories: photoSuggestions.reduce((s, i) => s + (i.calories || 0), 0),
      protein:  photoSuggestions.reduce((s, i) => s + (i.protein  || 0), 0),
      carbs:    photoSuggestions.reduce((s, i) => s + (i.carbs    || 0), 0),
      fat:      photoSuggestions.reduce((s, i) => s + (i.fat      || 0), 0),
      sodium:   photoSuggestions.reduce((s, i) => s + (i.sodium   || 0), 0),
      sugar:    photoSuggestions.reduce((s, i) => s + (i.sugar    || 0), 0),
      confidence: 'medium',
    })
    await addFoodToMeal([combo])
    if (currentUser && saveToLibrary) {
      const updatedLibrary = await addOrMergeFoodLibraryItems(currentUser.uid, [combo], { source: 'scan', incrementUsage: true })
      setFoodLibrary(updatedLibrary)
    }
    setPhotoSummary('')
    setPhotoSuggestions([])
    setPhotoError('')
    setSelectedPhotos((prev) => { prev.forEach((p) => URL.revokeObjectURL(p.previewUrl)); return [] })
    setPhotoContext('')
    setPhotoRejected(false)
    setComboName('')
    setShowComboSave(false)
    setSaveToLibrary(false)
    setShowAddFood(false)
  }

  const updateSuggestion = (idx, field, value) => {
    setPhotoSuggestions((current) =>
      current.map((item, itemIdx) => {
        if (itemIdx !== idx) return item

        if (['calories', 'protein', 'carbs', 'fat', 'sodium', 'sugar'].includes(field)) {
          return { ...item, [field]: Math.max(0, Number(value) || 0) }
        }

        if (field === 'quantity') {
          const nextQuantity = Math.max(1, Number(value) || 1)
          return {
            ...item,
            quantity: nextQuantity,
            calories: Math.round((Number(item.baseCalories) || 0) * nextQuantity),
            protein: Math.round((Number(item.baseProtein) || 0) * nextQuantity),
            carbs: Math.round((Number(item.baseCarbs) || 0) * nextQuantity),
            fat: Math.round((Number(item.baseFat) || 0) * nextQuantity),
            sodium: Math.round((Number(item.baseSodium) || 0) * nextQuantity),
            sugar: Math.round((Number(item.baseSugar) || 0) * nextQuantity)
          }
        }

        return { ...item, [field]: value }
      })
    )
  }

  const resetPhotoAnalysis = () => {
    setPhotoError('')
    setPhotoSummary('')
    setPhotoSuggestions([])
    setPhotoRejected(false)
  }

  const handlePhotoSelected = (event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return
    const newPhotos = files.map((file) => ({
      file,
      name: file.name,
      previewUrl: URL.createObjectURL(file),
    }))
    setSelectedPhotos((prev) => [...prev, ...newPhotos])
    resetPhotoAnalysis()
    event.target.value = ''
  }

  const removePhoto = (idx) => {
    setSelectedPhotos((prev) => {
      URL.revokeObjectURL(prev[idx].previewUrl)
      return prev.filter((_, i) => i !== idx)
    })
  }

  const submitForAnalysis = async () => {
    const hasPhotos = selectedPhotos.length > 0
    const hasText = !!photoContext.trim()

    if (!hasPhotos && !hasText) {
      setPhotoError('Add at least one photo or describe your food first.')
      return
    }

    setIsAnalyzingPhoto(true)

    try {
      const images = hasPhotos
        ? await Promise.all(selectedPhotos.map((p) => compressImage(p.file)))
        : undefined
      const response = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images, meal: selectedMeal, context: photoContext })
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.details || result.error || 'Could not analyze the food.')
      }

      setPhotoSummary(result.summary || '')
      setPhotoRejected(result.isFoodPhoto === false)
      setPhotoSuggestions((result.items || []).map((item) => ({
        name: item.name || '',
        portion: item.portion || '',
        quantity: 1,
        baseCalories: Math.max(0, Number(item.calories) || 0),
        baseProtein: Math.max(0, Number(item.protein) || 0),
        baseCarbs: Math.max(0, Number(item.carbs) || 0),
        baseFat: Math.max(0, Number(item.fat) || 0),
        baseSodium: Math.max(0, Number(item.sodium) || 0),
        baseSugar: Math.max(0, Number(item.sugar) || 0),
        calories: Math.max(0, Number(item.calories) || 0),
        protein: Math.max(0, Number(item.protein) || 0),
        carbs: Math.max(0, Number(item.carbs) || 0),
        fat: Math.max(0, Number(item.fat) || 0),
        sodium: Math.max(0, Number(item.sodium) || 0),
        sugar: Math.max(0, Number(item.sugar) || 0),
        confidence: item.confidence || 'medium'
      })))
    } catch (error) {
      setPhotoError(getFriendlyPhotoError(error.message))
    } finally {
      setIsAnalyzingPhoto(false)
    }
  }

  const savePhotoSuggestions = async () => {
    if (!photoSuggestions.length || photoRejected) return

    await addFoodToMeal(photoSuggestions)
    if (currentUser && saveToLibrary) {
      const updatedLibrary = await addOrMergeFoodLibraryItems(currentUser.uid, photoSuggestions, {
        source: 'scan',
        incrementUsage: true
      })
      setFoodLibrary(updatedLibrary)
    }
    setPhotoSummary('')
    setPhotoSuggestions([])
    setPhotoError('')
    setSelectedPhotos((prev) => { prev.forEach((p) => URL.revokeObjectURL(p.previewUrl)); return [] })
    setPhotoContext('')
    setPhotoRejected(false)
    setSaveToLibrary(false)
    setShowAddFood(false)
  }

  const openAddFood = () => {
    setSelectedMeal(getMealByTime())
    setShowAddFood(true)
  }

  const mealIcons = { breakfast: '🌅', lunch: '☀️', dinner: '🌙' }
  const mealNames = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner' }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto pt-4 pb-8">
        <button
          onClick={() => navigate('/')}
          className="group flex items-center gap-2 text-green-400 hover:text-green-300 font-semibold mb-8 transition-all"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          <span>Back to Home</span>
        </button>

        {/* Nutrition Summary */}
        <div className="relative group mb-8">
          <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
          <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-5xl font-black text-white">Nutrition</h1>
              <div className="text-6xl">🥗</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 p-6 border border-orange-500/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-orange-300 font-semibold uppercase text-sm tracking-wider">Calories</span>
                  <span className="text-3xl">🔥</span>
                </div>
                <div className="text-4xl font-black text-white mb-3">{totals.calories}</div>
                <div className="w-full bg-black/30 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min((totals.calories / foodData.calorieGoal) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="text-orange-300/60 text-sm mt-2">Goal: {foodData.calorieGoal} cal</div>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-6 border border-blue-500/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-blue-300 font-semibold uppercase text-sm tracking-wider">Protein</span>
                  <span className="text-3xl">💪</span>
                </div>
                <div className="text-4xl font-black text-white mb-3">{totals.protein}<span className="text-xl ml-1">g</span></div>
                <div className="w-full bg-black/30 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min((totals.protein / foodData.proteinGoal) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="text-blue-300/60 text-sm mt-2">Goal: {foodData.proteinGoal}g</div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-4 border border-green-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-green-300 font-semibold uppercase text-xs tracking-wider">Carbs</span>
                  <span className="text-lg">🌾</span>
                </div>
                <div className="text-2xl font-black text-white mb-2">{totals.carbs}<span className="text-sm ml-1">g</span></div>
                <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min((totals.carbs / foodData.carbGoal) * 100, 100)}%` }}></div>
                </div>
                <div className="text-green-300/60 text-xs mt-1">Goal: {foodData.carbGoal}g</div>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20 p-4 border border-yellow-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-yellow-300 font-semibold uppercase text-xs tracking-wider">Fat</span>
                  <span className="text-lg">🥑</span>
                </div>
                <div className="text-2xl font-black text-white mb-2">{totals.fat}<span className="text-sm ml-1">g</span></div>
                <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-yellow-500 to-amber-500 h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min((totals.fat / foodData.fatGoal) * 100, 100)}%` }}></div>
                </div>
                <div className="text-yellow-300/60 text-xs mt-1">Goal: {foodData.fatGoal}g</div>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-purple-500/20 to-violet-500/20 p-4 border border-purple-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-purple-300 font-semibold uppercase text-xs tracking-wider">Sodium</span>
                  <span className="text-lg">🧂</span>
                </div>
                <div className="text-2xl font-black text-white mb-2">{totals.sodium}<span className="text-sm ml-1">mg</span></div>
                <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-1000 ease-out ${totals.sodium > foodData.sodiumGoal ? 'bg-gradient-to-r from-red-500 to-rose-500' : 'bg-gradient-to-r from-purple-500 to-violet-500'}`}
                    style={{ width: `${Math.min((totals.sodium / foodData.sodiumGoal) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="text-purple-300/60 text-xs mt-1">Limit: {foodData.sodiumGoal}mg</div>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 p-4 border border-pink-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-pink-300 font-semibold uppercase text-xs tracking-wider">Sugar</span>
                  <span className="text-lg">🍬</span>
                </div>
                <div className="text-2xl font-black text-white mb-2">{totals.sugar}<span className="text-sm ml-1">g</span></div>
                <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-1000 ease-out ${totals.sugar > foodData.sugarGoal ? 'bg-gradient-to-r from-red-500 to-rose-500' : 'bg-gradient-to-r from-pink-500 to-rose-500'}`}
                    style={{ width: `${Math.min((totals.sugar / foodData.sugarGoal) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="text-pink-300/60 text-xs mt-1">Limit: {foodData.sugarGoal}g</div>
              </div>
            </div>
          </div>
        </div>

        {!showAddFood && (
          <button
            onClick={openAddFood}
            className="w-full py-5 mb-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-black text-xl rounded-2xl shadow-2xl transition-all transform hover:scale-105"
          >
            ➕ Add Food
          </button>
        )}

        {/* Add Food Panel */}
        {showAddFood && (
          <div className="relative group mb-8">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-30"></div>
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-white text-xl">Add Food</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Adding to {mealNames[selectedMeal]} {mealIcons[selectedMeal]}</p>
                </div>
                <button onClick={() => setShowAddFood(false)} className="text-gray-400 hover:text-white text-2xl">✕</button>
              </div>

              {/* AI Log */}
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5 mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-cyan-200 font-bold">AI Food Log</p>
                    <h4 className="text-xl font-black text-white mt-2">Describe or photo your meal</h4>
                    <p className="text-gray-300 mt-2">Type what you ate, take a photo, or both. Adjust amounts before saving.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:min-w-[360px]">
                    <label className="px-5 py-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black transition-all cursor-pointer text-center">
                      {selectedPhotos.length > 0 ? '+ Take Another' : 'Take Photo'}
                      <input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={handlePhotoSelected} />
                    </label>
                    <label className="px-5 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/10 font-black transition-all cursor-pointer text-center">
                      {selectedPhotos.length > 0 ? '+ Add More' : 'Choose Photos'}
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoSelected} />
                    </label>
                  </div>
                </div>

                <div className="mt-5">
                  <label className="block text-sm font-bold text-cyan-200 uppercase tracking-[0.2em] mb-2">
                    What did you eat?
                  </label>
                  <textarea
                    value={photoContext}
                    onChange={(e) => setPhotoContext(e.target.value)}
                    rows="3"
                    placeholder="e.g. 4 scrambled eggs with cheddar cheese  —  or  —  Domino's 2 slices pepperoni pizza"
                    className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                  <p className="text-sm text-gray-400 mt-2">
                    Text alone works — no photo needed.
                  </p>
                </div>

                {selectedPhotos.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-4">
                    {selectedPhotos.map((photo, idx) => (
                      <div key={idx} className="relative shrink-0">
                        <img
                          src={photo.previewUrl}
                          alt={photo.name}
                          className="w-20 h-20 object-cover rounded-xl border border-white/20"
                        />
                        <button
                          onClick={() => removePhoto(idx)}
                          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 hover:bg-red-400 text-white text-xs font-black flex items-center justify-center leading-none"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {(selectedPhotos.length > 0 || photoContext.trim()) && (
                  <div className="mt-4">
                    <button
                      onClick={submitForAnalysis}
                      disabled={isAnalyzingPhoto}
                      className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-black transition-all"
                    >
                      {isAnalyzingPhoto
                        ? 'Analyzing...'
                        : selectedPhotos.length > 1
                        ? `Analyze ${selectedPhotos.length} Photos`
                        : selectedPhotos.length === 1
                        ? 'Analyze Photo'
                        : 'Analyze Description'}
                    </button>
                  </div>
                )}

                {photoError && <p className="text-rose-300 text-sm mt-4">{photoError}</p>}
                {photoSummary && (
                  <p className={`text-sm mt-4 ${photoRejected ? 'text-amber-200' : 'text-gray-200'}`}>{photoSummary}</p>
                )}

                {photoRejected && (
                  <div className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4">
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-300">Not A Meal Photo</p>
                    <p className="text-sm text-amber-100 mt-2">
                      That image does not look like food. Try a clearer meal photo.
                    </p>
                  </div>
                )}

                {photoSuggestions.length > 0 && !photoRejected && (
                  <div className="space-y-4 mt-5">
                    {photoSuggestions.map((item, idx) => (
                      <div key={`${item.name}-${idx}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateSuggestion(idx, 'name', e.target.value)}
                            className="p-3 rounded-xl bg-black/20 border border-white/10 text-white outline-none"
                            placeholder="Food name"
                          />
                          <input
                            type="text"
                            value={item.portion}
                            onChange={(e) => updateSuggestion(idx, 'portion', e.target.value)}
                            className="p-3 rounded-xl bg-black/20 border border-white/10 text-white outline-none"
                            placeholder="Portion"
                          />
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateSuggestion(idx, 'quantity', e.target.value)}
                            className="p-3 rounded-xl bg-black/20 border border-white/10 text-white outline-none"
                            placeholder="Quantity"
                          />
                          <div className="rounded-xl bg-black/20 border border-white/10 p-3 text-sm text-cyan-200">
                            Actual: {getDisplayPortion(item) || `${item.quantity}x`}
                          </div>
                          <input
                            type="number"
                            value={item.calories}
                            onChange={(e) => updateSuggestion(idx, 'calories', e.target.value)}
                            className="p-3 rounded-xl bg-black/20 border border-white/10 text-white outline-none"
                            placeholder="Calories"
                          />
                          <input
                            type="number"
                            value={item.protein}
                            onChange={(e) => updateSuggestion(idx, 'protein', e.target.value)}
                            className="p-3 rounded-xl bg-black/20 border border-white/10 text-white outline-none"
                            placeholder="Protein (g)"
                          />
                          <input
                            type="number"
                            value={item.carbs}
                            onChange={(e) => updateSuggestion(idx, 'carbs', e.target.value)}
                            className="p-3 rounded-xl bg-black/20 border border-white/10 text-white outline-none"
                            placeholder="Carbs (g)"
                          />
                          <input
                            type="number"
                            value={item.fat}
                            onChange={(e) => updateSuggestion(idx, 'fat', e.target.value)}
                            className="p-3 rounded-xl bg-black/20 border border-white/10 text-white outline-none"
                            placeholder="Fat (g)"
                          />
                          <input
                            type="number"
                            value={item.sodium}
                            onChange={(e) => updateSuggestion(idx, 'sodium', e.target.value)}
                            className="p-3 rounded-xl bg-black/20 border border-white/10 text-white outline-none"
                            placeholder="Sodium (mg)"
                          />
                          <input
                            type="number"
                            value={item.sugar}
                            onChange={(e) => updateSuggestion(idx, 'sugar', e.target.value)}
                            className="p-3 rounded-xl bg-black/20 border border-white/10 text-white outline-none"
                            placeholder="Sugar (g)"
                          />
                        </div>
                        <div className="flex items-center justify-between gap-3 mt-4">
                          <span className={`px-3 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em] ${
                            item.confidence === 'high'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                              : item.confidence === 'low'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                          }`}>
                            {item.confidence}
                          </span>
                          <button
                            onClick={() => setPhotoSuggestions((current) => current.filter((_, i) => i !== idx))}
                            className="text-rose-300 hover:text-rose-200 font-semibold"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="space-y-3">
                      {photoSuggestions.length > 1 && (
                        <div>
                          {showComboSave ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={comboName}
                                onChange={(e) => setComboName(e.target.value)}
                                placeholder={photoSuggestions.map((i) => i.name).join(', ')}
                                className="flex-1 p-3 rounded-xl bg-black/20 border border-white/10 text-white outline-none focus:ring-2 focus:ring-purple-400 placeholder-gray-500 text-sm"
                              />
                              <button
                                onClick={saveAsCombo}
                                className="px-5 py-3 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-black transition-all"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setShowComboSave(false)}
                                className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowComboSave(true)}
                              className="w-full py-3 rounded-2xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 text-purple-200 font-bold transition-all"
                            >
                              Merge into one combo meal
                            </button>
                          )}
                        </div>
                      )}
                      <button
                        onClick={() => setSaveToLibrary((v) => !v)}
                        className={`w-full py-3 rounded-2xl border font-semibold text-sm transition-all ${
                          saveToLibrary
                            ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200'
                            : 'bg-white/5 border-white/10 text-gray-400'
                        }`}
                      >
                        {saveToLibrary ? '✓ Save to library' : 'Save to library (off)'}
                      </button>
                      <button
                        onClick={savePhotoSuggestions}
                        className="w-full py-4 rounded-2xl bg-white text-slate-950 font-black hover:bg-slate-100 transition-all"
                      >
                        Save individually to {mealNames[selectedMeal]}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Library */}
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-white">Select from Library</h4>
                {selectedLibraryItems.size > 0 && (
                  <button
                    onClick={addSelectedFromLibrary}
                    className="px-4 py-2 rounded-xl bg-green-500 hover:bg-green-400 text-slate-950 font-black text-sm transition-all"
                  >
                    Add {selectedLibraryItems.size} item{selectedLibraryItems.size > 1 ? 's' : ''}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                {foodLibrary.map((food, idx) => {
                  const isSelected = selectedLibraryItems.has(idx)
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleLibrarySelection(idx)}
                      className={`text-left p-3 rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-green-500/20 border-green-400/60'
                          : 'bg-white/5 hover:bg-white/10 border-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-semibold text-white">{food.name}</p>
                        <div className="flex items-center gap-2 shrink-0">
                          {!!food.useCount && (
                            <span className="text-[10px] uppercase tracking-[0.2em] px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-400/20">
                              {food.useCount}x
                            </span>
                          )}
                          <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs ${
                            isSelected ? 'bg-green-500 border-green-400 text-white' : 'border-white/30'
                          }`}>
                            {isSelected ? '✓' : ''}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-400">{food.calories} cal • {food.protein}g protein</p>
                      {food.portion && <p className="text-xs text-gray-500 mt-1">{food.portion}</p>}
                    </button>
                  )
                })}
              </div>
              {foodLibrary.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-gray-400 mb-3">No foods in library yet</p>
                  <button onClick={() => navigate('/edit')} className="text-green-400 hover:text-green-300 underline">
                    Add foods to library →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Meal Sections */}
        {MEALS.map((meal) => (
          <div key={meal} className="relative group mb-6">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl blur opacity-20"></div>
            <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">{mealIcons[meal]}</span>
                <h2 className="text-3xl font-black text-white">{mealNames[meal]}</h2>
              </div>

              {foodData[meal] && foodData[meal].length > 0 ? (
                <div className="space-y-2">
                  {foodData[meal].map((item, idx) => {
                    const key = `${meal}-${idx}`
                    const isEditing = editingKey === key
                    const isExpanded = expandedItems.has(key)
                    const hasExtras = !!(item.carbs || item.fat || item.sodium || item.sugar)

                    if (isEditing) {
                      return (
                        <div key={idx} className="p-4 rounded-xl border border-blue-400/40 bg-blue-500/10 space-y-3">
                          <input
                            type="text"
                            value={editValues.name || ''}
                            onChange={(e) => setEditValues((v) => ({ ...v, name: e.target.value }))}
                            className="w-full p-3 rounded-xl bg-black/20 border border-white/10 text-white font-semibold outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder="Food name"
                          />
                          <div className="grid grid-cols-3 gap-2">
                            {[['calories','cal'],['protein','g prot'],['quantity','qty']].map(([field, label]) => (
                              <div key={field}>
                                <p className="text-xs text-gray-400 mb-1">{label}</p>
                                <input
                                  type="number"
                                  value={editValues[field] ?? ''}
                                  onChange={(e) => setEditValues((v) => ({ ...v, [field]: e.target.value }))}
                                  className="w-full p-2 rounded-lg bg-black/20 border border-white/10 text-white outline-none focus:ring-1 focus:ring-blue-400 text-sm"
                                />
                              </div>
                            ))}
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {[['carbs','g carbs'],['fat','g fat'],['sodium','mg Na'],['sugar','g sugar']].map(([field, label]) => (
                              <div key={field}>
                                <p className="text-xs text-gray-400 mb-1">{label}</p>
                                <input
                                  type="number"
                                  value={editValues[field] ?? ''}
                                  onChange={(e) => setEditValues((v) => ({ ...v, [field]: e.target.value }))}
                                  className="w-full p-2 rounded-lg bg-black/20 border border-white/10 text-white outline-none focus:ring-1 focus:ring-blue-400 text-sm"
                                />
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEdit(meal, idx)}
                              className="flex-1 py-2 rounded-xl bg-green-500 hover:bg-green-400 text-white font-black transition-all"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => { cancelEdit(); removeFoodItem(meal, idx) }}
                              className="py-2 px-4 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold transition-all"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border transition-all ${
                          item.eaten ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={item.eaten}
                            onChange={() => toggleFood(meal, idx)}
                            className="w-5 h-5 rounded border-2 border-white/30 bg-white/10 checked:bg-green-500 checked:border-green-500 cursor-pointer transition-all shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <span className={`font-semibold ${item.eaten ? 'text-green-300' : 'text-white'}`}>
                              {item.name}
                            </span>
                            {getDisplayPortion(item) && (
                              <span className="text-xs text-gray-400 ml-2">{getDisplayPortion(item)}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0 text-sm">
                            <span className="text-orange-300 font-medium">{item.calories} cal</span>
                            <span className="text-blue-300 font-medium">{item.protein}g</span>
                            {hasExtras && (
                              <button
                                onClick={() => toggleItemExpanded(key)}
                                className="text-gray-400 hover:text-white w-5 h-5 flex items-center justify-center transition-all text-xs"
                              >
                                {isExpanded ? '▴' : '▾'}
                              </button>
                            )}
                            <button
                              onClick={() => startEdit(meal, idx)}
                              className="text-gray-400 hover:text-white transition-all text-sm px-1"
                              title="Edit"
                            >
                              ✏️
                            </button>
                          </div>
                        </div>
                        {isExpanded && hasExtras && (
                          <div className="flex flex-wrap gap-2 mt-2 pl-8 text-xs">
                            {!!item.carbs && (
                              <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded-full border border-green-500/30">
                                {item.carbs}g carbs
                              </span>
                            )}
                            {!!item.fat && (
                              <span className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full border border-yellow-500/30">
                                {item.fat}g fat
                              </span>
                            )}
                            {!!item.sodium && (
                              <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full border border-purple-500/30">
                                {item.sodium}mg sodium
                              </span>
                            )}
                            {!!item.sugar && (
                              <span className="bg-pink-500/20 text-pink-300 px-2 py-1 rounded-full border border-pink-500/30">
                                {item.sugar}g sugar
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-500 italic text-center py-4">No items added yet</p>
              )}
            </div>
          </div>
        ))}

      </div>
    </div>
  )
}
