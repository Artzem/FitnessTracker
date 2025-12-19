import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { storage, STORAGE_KEYS } from './storage'
import { defaultWorkouts } from './workoutLogic'

// SAFETY CHECK: If defaultWorkouts didn't import, provide a fallback
const SAFE_DEFAULTS = defaultWorkouts || { 'Legs': [], 'Chest & Triceps': [], 'Back & Biceps': [] };

export const migrateLocalStorageToFirestore = async (userId) => {
  console.log("Migration skipped for 2025 cleanup.");
  return;
}

export function clearLocalCache() {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('fittrack_') || key.startsWith('workout_progress_')) {
      localStorage.removeItem(key)
    }
  })
}

// Workouts
export const syncWorkouts = async (userId, data) => {
  if (!userId) return
  const cacheKey = `${STORAGE_KEYS.WORKOUTS}_${userId}`
  storage.set(cacheKey, data)
  await setDoc(doc(db, 'users', userId, 'data', 'workouts'), data)
}

export const loadWorkouts = async (userId) => {
  if (!userId) return SAFE_DEFAULTS
  const cacheKey = `${STORAGE_KEYS.WORKOUTS}_${userId}`
  let localData = storage.get(cacheKey)
  if (localData) return localData
  
  try {
    const docRef = await getDoc(doc(db, 'users', userId, 'data', 'workouts'))
    if (docRef.exists()) {
      const data = docRef.data()
      storage.set(cacheKey, data)
      return data
    }
  } catch (error) {
    console.error('Error loading workouts:', error)
  }
  return SAFE_DEFAULTS
}

// Schedule & Overrides
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
  if (localData) return localData
  
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
  return {}
}

export const loadSchedule = async (userId) => {
  if (!userId) return { overrides: {} }
  const overrides = await loadWorkoutOverrides(userId)
  return { overrides }
}

// Food
export const syncFood = async (userId, dateKey, data) => {
  if (!userId) return
  const cacheKey = `${STORAGE_KEYS.FOOD_PREFIX}${userId}_${dateKey}`
  storage.set(cacheKey, data)
  await setDoc(doc(db, 'users', userId, 'food', dateKey), data)
}

export const loadFood = async (userId, dateKey) => {
  if (!userId) return { items: [], calorieGoal: 2000, proteinGoal: 150 }
  const cacheKey = `${STORAGE_KEYS.FOOD_PREFIX}${userId}_${dateKey}`
  let localData = storage.get(cacheKey)
  if (localData) return localData
  
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
  return { items: [], calorieGoal: 2000, proteinGoal: 150 }
}

// Workout Progress
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
  if (localData) return localData
  
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
  return null
}

// 👇 ADDED BACK: Needed for Calendar Charts
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

// 👇 ADDED BACK: Needed for Calendar Charts
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

// Food Library
export const syncFoodList = async (userId, data) => {
  if (!userId) return
  const cacheKey = `${STORAGE_KEYS.FOOD_LIST}_${userId}`
  storage.set(cacheKey, data)
  await setDoc(doc(db, 'users', userId, 'data', 'foodList'), { items: data })
}

export const loadFoodList = async (userId) => {
  if (!userId) return []
  const cacheKey = `${STORAGE_KEYS.FOOD_LIST}_${userId}`
  let localData = storage.get(cacheKey)
  if (localData) return localData
  
  try {
    const docRef = await getDoc(doc(db, 'users', userId, 'data', 'foodList'))
    if (docRef.exists()) {
      const data = docRef.data().items || []
      storage.set(cacheKey, data)
      return data
    }
  } catch (error) {
    console.error('Error loading food list:', error)
  }
  return []
}
