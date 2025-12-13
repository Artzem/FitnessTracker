import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { storage, STORAGE_KEYS } from './storage'
import { defaultWorkouts } from './workoutLogic'

// Get current user ID (must be called after user is authenticated)
function getUserId() {
  const user = JSON.parse(localStorage.getItem('currentUser'))
  return user?.uid || null
}

// Migration function - moves localStorage data to Firestore
export async function migrateLocalStorageToFirestore(userId) {
  try {
    // Migrate workouts
    const localWorkouts = storage.get(STORAGE_KEYS.WORKOUTS)
    if (localWorkouts) {
      await setDoc(doc(db, 'users', userId, 'data', 'workouts'), localWorkouts)
    }

    // Migrate schedule
    const localSchedule = storage.get(STORAGE_KEYS.SCHEDULE)
    if (localSchedule) {
      await setDoc(doc(db, 'users', userId, 'data', 'schedule'), localSchedule)
    }

    // Migrate food library
    const localFoodList = storage.get(STORAGE_KEYS.FOOD_LIST)
    if (localFoodList) {
      await setDoc(doc(db, 'users', userId, 'data', 'foodList'), { items: localFoodList })
    }

    // Migrate all food entries
    const allKeys = Object.keys(localStorage)
    for (const key of allKeys) {
      if (key.startsWith(STORAGE_KEYS.FOOD_PREFIX)) {
        const dateKey = key.replace(STORAGE_KEYS.FOOD_PREFIX, '')
        const data = storage.get(key)
        if (data) {
          await setDoc(doc(db, 'users', userId, 'food', dateKey), data)
        }
      }
      if (key.startsWith('workout_progress_')) {
        const dateKey = key.replace('workout_progress_', '')
        const data = storage.get(key)
        if (data) {
          await setDoc(doc(db, 'users', userId, 'workoutProgress', dateKey), data)
        }
      }
    }

    console.log('Migration complete!')
  } catch (error) {
    console.error('Migration error:', error)
  }
}

// Workouts
export const syncWorkouts = async (data) => {
  const userId = getUserId()
  if (!userId) return
  storage.set(STORAGE_KEYS.WORKOUTS, data)
  await setDoc(doc(db, 'users', userId, 'data', 'workouts'), data)
}

export const loadWorkouts = async () => {
  const userId = getUserId()
  if (!userId) return defaultWorkouts

  // Try localStorage first
  let localData = storage.get(STORAGE_KEYS.WORKOUTS)
  if (localData) return localData
  
  // Then Firestore
  const docRef = await getDoc(doc(db, 'users', userId, 'data', 'workouts'))
  if (docRef.exists()) {
    const data = docRef.data()
    storage.set(STORAGE_KEYS.WORKOUTS, data)
    return data
  }
  
  // Initialize with defaults
  await syncWorkouts(defaultWorkouts)
  return defaultWorkouts
}

// Schedule
export const syncSchedule = async (data) => {
  const userId = getUserId()
  if (!userId) return
  storage.set(STORAGE_KEYS.SCHEDULE, data)
  await setDoc(doc(db, 'users', userId, 'data', 'schedule'), data)
}

export const loadSchedule = async () => {
  const userId = getUserId()
  if (!userId) return { skippedDays: [] }

  let localData = storage.get(STORAGE_KEYS.SCHEDULE)
  if (localData) return localData
  
  const docRef = await getDoc(doc(db, 'users', userId, 'data', 'schedule'))
  if (docRef.exists()) {
    const data = docRef.data()
    storage.set(STORAGE_KEYS.SCHEDULE, data)
    return data
  }
  
  const defaultSchedule = { skippedDays: [] }
  await syncSchedule(defaultSchedule)
  return defaultSchedule
}

// Food
export const syncFood = async (dateKey, data) => {
  const userId = getUserId()
  if (!userId) return
  storage.set(STORAGE_KEYS.FOOD_PREFIX + dateKey, data)
  await setDoc(doc(db, 'users', userId, 'food', dateKey), data)
}

export const loadFood = async (dateKey) => {
  const userId = getUserId()
  if (!userId) return { items: [], calorieGoal: 2000, proteinGoal: 150 }

  let localData = storage.get(STORAGE_KEYS.FOOD_PREFIX + dateKey)
  if (localData) return localData
  
  const docRef = await getDoc(doc(db, 'users', userId, 'food', dateKey))
  if (docRef.exists()) {
    const data = docRef.data()
    storage.set(STORAGE_KEYS.FOOD_PREFIX + dateKey, data)
    return data
  }
  
  return { items: [], calorieGoal: 2000, proteinGoal: 150 }
}

// Food Library
export const syncFoodList = async (data) => {
  const userId = getUserId()
  if (!userId) return
  storage.set(STORAGE_KEYS.FOOD_LIST, data)
  await setDoc(doc(db, 'users', userId, 'data', 'foodList'), { items: data })
}

export const loadFoodList = async () => {
  const userId = getUserId()
  if (!userId) return []

  let localData = storage.get(STORAGE_KEYS.FOOD_LIST)
  if (localData) return localData
  
  const docRef = await getDoc(doc(db, 'users', userId, 'data', 'foodList'))
  if (docRef.exists()) {
    const data = docRef.data().items || []
    storage.set(STORAGE_KEYS.FOOD_LIST, data)
    return data
  }
  
  return []
}

// Workout Progress
export const syncWorkoutProgress = async (dateKey, data) => {
  const userId = getUserId()
  if (!userId) return
  const key = `workout_progress_${dateKey}`
  storage.set(key, data)
  await setDoc(doc(db, 'users', userId, 'workoutProgress', dateKey), data)
}

export const loadWorkoutProgress = async (dateKey) => {
  const userId = getUserId()
  if (!userId) return null

  const key = `workout_progress_${dateKey}`
  let localData = storage.get(key)
  if (localData) return localData
  
  const docRef = await getDoc(doc(db, 'users', userId, 'workoutProgress', dateKey))
  if (docRef.exists()) {
    const data = docRef.data()
    storage.set(key, data)
    return data
  }
  
  return null
}

export const loadAllWorkoutProgress = async () => {
  const userId = getUserId()
  if (!userId) return {}

  const progress = {}
  const querySnapshot = await getDocs(collection(db, 'users', userId, 'workoutProgress'))
  querySnapshot.forEach((doc) => {
    progress[doc.id] = doc.data()
    storage.set(`workout_progress_${doc.id}`, doc.data())
  })
  
  return progress
}

export const loadAllFoodProgress = async () => {
  const userId = getUserId()
  if (!userId) return {}

  const progress = {}
  const querySnapshot = await getDocs(collection(db, 'users', userId, 'food'))
  querySnapshot.forEach((doc) => {
    progress[doc.id] = doc.data()
    storage.set(STORAGE_KEYS.FOOD_PREFIX + doc.id, doc.data())
  })
  
  return progress
}