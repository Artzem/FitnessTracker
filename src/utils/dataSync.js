import { doc, getDoc, setDoc, collection, getDocs, query, orderBy, limit, documentId } from 'firebase/firestore'
import { db } from '../firebase'
import { storage, STORAGE_KEYS } from './storage'
import { DEFAULT_PROFILE } from './workoutLogic'
import { defaultWorkouts, PLAN_VERSION } from './basicFitPlan'

const DEFAULT_DAILY_FOOD = {
  breakfast: [],
  lunch: [],
  dinner: [],
  calorieGoal: 2000,
  proteinGoal: 130,
};

const DEFAULT_DAILY_HABITS = {
  waterBottles: 0,
  waterGoal: 5
}

const normalizeFoodLibraryItem = (item = {}) => ({
  name: item.name || '',
  calories: Number(item.calories) || 0,
  protein: Number(item.protein) || 0,
  carbs: Number(item.carbs) || 0,
  fat: Number(item.fat) || 0,
  sodium: Number(item.sodium) || 0,
  sugar: Number(item.sugar) || 0,
  quantity: Math.max(1, Number(item.quantity) || 1),
  portion: item.portion || '',
  useCount: Math.max(0, Number(item.useCount) || 0),
  lastUsedAt: item.lastUsedAt || '',
  lastSource: item.lastSource || ''
})

const sortFoodLibrary = (items = []) =>
  [...items].sort((left, right) => {
    const useCountDiff = (Number(right.useCount) || 0) - (Number(left.useCount) || 0)
    if (useCountDiff !== 0) return useCountDiff

    const rightUsedAt = right.lastUsedAt ? new Date(right.lastUsedAt).getTime() : 0
    const leftUsedAt = left.lastUsedAt ? new Date(left.lastUsedAt).getTime() : 0
    if (rightUsedAt !== leftUsedAt) return rightUsedAt - leftUsedAt

    return String(left.name || '').localeCompare(String(right.name || ''))
  })

const getFoodLibraryMatchKey = (item = {}) =>
  [String(item.name || '').trim().toLowerCase(), String(item.portion || '').trim().toLowerCase()].join('::')

// Only fills in a missing bucket — never overwrites what the user has saved
const mergeWorkoutDefaults = (data) => ({
  Push: data?.Push?.length ? data.Push : defaultWorkouts.Push,
  Pull: data?.Pull?.length ? data.Pull : defaultWorkouts.Pull,
  Legs: data?.Legs?.length ? data.Legs : defaultWorkouts.Legs,
})

export const migrateLocalStorageToFirestore = async (userId) => {
  console.log("Migration skipped for 2025 cleanup.");
  return;
}

export function clearLocalCache() {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('fittrack_') || key.startsWith('workout_progress_') || key.startsWith('daily_habits_')) {
      localStorage.removeItem(key)
    }
  })
}

// --- WORKOUTS ---
export const syncWorkouts = async (userId, data) => {
  if (!userId) return
  const cacheKey = `${STORAGE_KEYS.WORKOUTS}_${userId}`
  const versioned = { ...data, planVersion: PLAN_VERSION }
  storage.set(cacheKey, versioned)
  await setDoc(doc(db, 'users', userId, 'data', 'workouts'), versioned)
}

export const loadWorkouts = async (userId) => {
  if (!userId) return defaultWorkouts
  
  const cacheKey = `${STORAGE_KEYS.WORKOUTS}_${userId}`
  let localData = storage.get(cacheKey)
  
  try {
    const docRef = await getDoc(doc(db, 'users', userId, 'data', 'workouts'))
    if (docRef.exists() && docRef.data().planVersion === PLAN_VERSION) {
      const data = mergeWorkoutDefaults(docRef.data())
      storage.set(cacheKey, { ...data, planVersion: PLAN_VERSION })
      return data
    }
    // New account, or a plan saved before Basic-Fit: replace it with Basic-Fit
    await syncWorkouts(userId, defaultWorkouts)
    return defaultWorkouts
  } catch (error) {
    console.error('Error loading workouts:', error)
  }

  return mergeWorkoutDefaults(localData?.planVersion === PLAN_VERSION ? localData : null)
}

// --- OVERRIDES ---
export const syncWorkoutOverrides = async (userId, data) => {
  if (!userId) return
  const cacheKey = `workout_overrides_${userId}`
  storage.set(cacheKey, data)
  await setDoc(doc(db, 'users', userId, 'data', 'workoutOverrides'), data)
}

export const loadWorkoutOverrides = async (userId) => {
  if (!userId) return {}
  const cacheKey = `workout_overrides_${userId}`
  let localData = storage.get(cacheKey)
  
  try {
    const docRef = await getDoc(doc(db, 'users', userId, 'data', 'workoutOverrides'))
    if (docRef.exists()) {
      const data = docRef.data()
      storage.set(cacheKey, data)
      return data
    }
  } catch (error) {
    console.error('Error loading overrides:', error)
  }
  return localData || {}
}

export const loadSchedule = async (userId) => {
  if (!userId) return { overrides: {} }
  const overrides = await loadWorkoutOverrides(userId)
  return { overrides }
}

// --- DAILY HABITS ---
export const syncDailyHabits = async (userId, dateKey, data) => {
  if (!userId) return
  const cacheKey = `${STORAGE_KEYS.DAILY_HABITS}_${userId}_${dateKey}`
  const normalized = {
    ...DEFAULT_DAILY_HABITS,
    ...(data || {}),
    waterBottles: Math.max(0, Number(data?.waterBottles) || 0),
    waterGoal: Math.max(1, Number(data?.waterGoal) || DEFAULT_DAILY_HABITS.waterGoal)
  }

  storage.set(cacheKey, normalized)
  await setDoc(doc(db, 'users', userId, 'dailyHabits', dateKey), normalized)
}

export const loadDailyHabits = async (userId, dateKey) => {
  if (!userId) return DEFAULT_DAILY_HABITS
  const cacheKey = `${STORAGE_KEYS.DAILY_HABITS}_${userId}_${dateKey}`
  const localData = storage.get(cacheKey)

  try {
    const docRef = await getDoc(doc(db, 'users', userId, 'dailyHabits', dateKey))
    if (docRef.exists()) {
      const data = { ...DEFAULT_DAILY_HABITS, ...docRef.data() }
      storage.set(cacheKey, data)
      return data
    }
  } catch (error) {
    console.error('Error loading daily habits:', error)
  }

  return localData || DEFAULT_DAILY_HABITS
}

// --- FOOD (UPDATED WITH DEFAULTS) ---
export const syncFood = async (userId, dateKey, data) => {
  if (!userId) {
    console.error("❌ syncFood Error: No User ID provided. Cannot save.");
    return;
  }
  
  const cacheKey = `${STORAGE_KEYS.FOOD_PREFIX}${userId}_${dateKey}`
  storage.set(cacheKey, data)
  
  try {
    await setDoc(doc(db, 'users', userId, 'food', dateKey), data)
    console.log("✅ Food saved to cloud successfully for:", dateKey);
  } catch (e) {
    console.error("❌ Error saving food to cloud:", e)
  }
}

export const loadFood = async (userId, dateKey) => {
  if (!userId) return DEFAULT_DAILY_FOOD

  const cacheKey = `${STORAGE_KEYS.FOOD_PREFIX}${userId}_${dateKey}`
  let localData = storage.get(cacheKey)

  try {
    const docRef = await getDoc(doc(db, 'users', userId, 'food', dateKey))
    if (docRef.exists()) {
      const data = docRef.data()
      storage.set(cacheKey, data)
      return data
    }
  } catch (error) {
    console.error('Error loading food:', error)
  }

  return localData || DEFAULT_DAILY_FOOD
}

// --- WORKOUT PROGRESS ---
export const syncWorkoutProgress = async (userId, dateKey, data) => {
  if (!userId) return
  const cacheKey = `workout_progress_${userId}_${dateKey}`
  storage.set(cacheKey, data)
  await setDoc(doc(db, 'users', userId, 'workoutProgress', dateKey), data)
}

export const loadWorkoutProgress = async (userId, dateKey) => {
  if (!userId) return null
  const cacheKey = `workout_progress_${userId}_${dateKey}`
  let localData = storage.get(cacheKey)
  
  try {
    const docRef = await getDoc(doc(db, 'users', userId, 'workoutProgress', dateKey))
    if (docRef.exists()) {
      const data = docRef.data()
      storage.set(cacheKey, data)
      return data
    }
  } catch (error) {
    console.error('Error loading workout progress:', error)
  }
  return localData || null
}

export const loadAllWorkoutProgress = async (userId) => {
  if (!userId) return {}
  const progress = {}
  try {
    const querySnapshot = await getDocs(collection(db, 'users', userId, 'workoutProgress'))
    querySnapshot.forEach((doc) => {
      progress[doc.id] = doc.data()
    })
  } catch (error) {
    console.error('Error loading all workout progress:', error)
  }
  return progress
}

// Workout type of the most recent day before beforeDateKey with a completed set ('' if none).
// Drives the Legs → Pull → Push rotation.
export const loadLastLoggedWorkout = async (userId, beforeDateKey) => {
  if (!userId) return ''
  try {
    const recent = await getDocs(query(
      collection(db, 'users', userId, 'workoutProgress'),
      orderBy(documentId(), 'desc'),
      limit(14)
    ))
    const last = recent.docs.find((d) =>
      d.id < beforeDateKey && d.data().exercises?.some((ex) => ex.sets?.some((set) => set.completed))
    )
    return last?.data().workout || ''
  } catch (error) {
    console.error('Error loading last logged workout:', error)
    return ''
  }
}

export const loadAllFoodProgress = async (userId) => {
  if (!userId) return {}
  const progress = {}
  try {
    const querySnapshot = await getDocs(collection(db, 'users', userId, 'food'))
    querySnapshot.forEach((doc) => {
      progress[doc.id] = doc.data()
    })
  } catch (error) {
    console.error('Error loading all food progress:', error)
  }
  return progress
}

// --- FOOD LIBRARY ---
export const syncFoodList = async (userId, data) => {
  if (!userId) return
  const cacheKey = `${STORAGE_KEYS.FOOD_LIST}_${userId}`
  const cleanData = sortFoodLibrary((Array.isArray(data) ? data : []).map(normalizeFoodLibraryItem))
  storage.set(cacheKey, cleanData)
  try {
    await setDoc(doc(db, 'users', userId, 'data', 'foodList'), { items: cleanData })
  } catch (e) {
    console.error("❌ Error saving food library:", e)
  }
}

export const loadFoodList = async (userId) => {
  if (!userId) return []
  const cacheKey = `${STORAGE_KEYS.FOOD_LIST}_${userId}`
  let localData = storage.get(cacheKey)
  try {
    const docRef = await getDoc(doc(db, 'users', userId, 'data', 'foodList'))
    if (docRef.exists()) {
      const data = sortFoodLibrary((docRef.data().items || []).map(normalizeFoodLibraryItem))
      storage.set(cacheKey, data)
      return data
    }
  } catch (error) {
    console.error('Error loading food list:', error)
  }
  return sortFoodLibrary((localData || []).map(normalizeFoodLibraryItem))
}

export const addOrMergeFoodLibraryItems = async (userId, items, options = {}) => {
  if (!userId || !Array.isArray(items) || items.length === 0) return []

  const { source = 'manual', incrementUsage = true } = options
  const currentItems = await loadFoodList(userId)
  const mergedItems = [...currentItems]
  const nowIso = new Date().toISOString()

  items.forEach((rawItem) => {
    const item = normalizeFoodLibraryItem(rawItem)
    const matchKey = getFoodLibraryMatchKey(item)
    const existingIndex = mergedItems.findIndex((candidate) => getFoodLibraryMatchKey(candidate) === matchKey)

    if (existingIndex >= 0) {
      const existing = mergedItems[existingIndex]
      mergedItems[existingIndex] = normalizeFoodLibraryItem({
        ...existing,
        ...item,
        useCount: (Number(existing.useCount) || 0) + (incrementUsage ? 1 : 0),
        lastUsedAt: nowIso,
        lastSource: source
      })
      return
    }

    mergedItems.push(normalizeFoodLibraryItem({
      ...item,
      useCount: incrementUsage ? 1 : item.useCount,
      lastUsedAt: nowIso,
      lastSource: source
    }))
  })

  const sorted = sortFoodLibrary(mergedItems)
  await syncFoodList(userId, sorted)
  return sorted
}

// --- TRAINING PROFILE ---
export const syncTrainingProfile = async (userId, data) => {
  if (!userId) return
  const cacheKey = `${STORAGE_KEYS.TRAINING_PROFILE}_${userId}`
  storage.set(cacheKey, data)
  await setDoc(doc(db, 'users', userId, 'data', 'trainingProfile'), data)
}

export const loadTrainingProfile = async (userId) => {
  if (!userId) return DEFAULT_PROFILE
  const cacheKey = `${STORAGE_KEYS.TRAINING_PROFILE}_${userId}`
  const localData = storage.get(cacheKey)

  try {
    const docRef = await getDoc(doc(db, 'users', userId, 'data', 'trainingProfile'))
    if (docRef.exists()) {
      const data = { ...DEFAULT_PROFILE, ...docRef.data() }
      storage.set(cacheKey, data)
      return data
    }
  } catch (error) {
    console.error('Error loading training profile:', error)
  }

  return localData || DEFAULT_PROFILE
}
