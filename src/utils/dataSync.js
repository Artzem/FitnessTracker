import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { storage, STORAGE_KEYS } from './storage'
import { defaultWorkouts } from './workoutLogic'

// Get current user ID from Firebase Auth (NOT localStorage)
function getUserId() {
  const user = auth.currentUser
  if (!user) {
    console.warn('No authenticated user')
    return null
  }
  return user.uid
}

// Clear localStorage when switching users
export function clearLocalCache() {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('fittrack_') || key.startsWith('workout_progress_')) {
      localStorage.removeItem(key)
    }
  })
}

// Migration function - moves localStorage data to Firestore
export async function migrateLocalStorageToFirestore(userId) {
  try {
    console.log('Starting migration for user:', userId)
    
    // Migrate workouts
    const localWorkouts = storage.get(STORAGE_KEYS.WORKOUTS)
    if (localWorkouts) {
      await setDoc(doc(db, 'users', userId, 'data', 'workouts'), localWorkouts)
      console.log('Migrated workouts')
    }

    // Migrate schedule
    const localSchedule = storage.get(STORAGE_KEYS.SCHEDULE)
    if (localSchedule) {
      await setDoc(doc(db, 'users', userId, 'data', 'schedule'), localSchedule)
      console.log('Migrated schedule')
    }

    // Migrate food library
    const localFoodList = storage.get(STORAGE_KEYS.FOOD_LIST)
    if (localFoodList) {
      await setDoc(doc(db, 'users', userId, 'data', 'foodList'), { items: localFoodList })
      console.log('Migrated food list')
    }

    // Migrate all food entries
    const allKeys = Object.keys(localStorage)
    for (const key of allKeys) {
      if (key.startsWith(STORAGE_KEYS.FOOD_PREFIX)) {
        const dateKey = key.replace(STORAGE_KEYS.FOOD_PREFIX, '')
        const data = storage.get(key)
        if (data) {
          await setDoc(doc(db, 'users', userId, 'food', dateKey), data)
          console.log('Migrated food for date:', dateKey)
        }
      }
      if (key.startsWith('workout_progress_')) {
        const dateKey = key.replace('workout_progress_', '')
        const data = storage.get(key)
        if (data) {
          await setDoc(doc(db, 'users', userId, 'workoutProgress', dateKey), data)
          console.log('Migrated workout progress for date:', dateKey)
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
  if (!userId) {
    console.warn('Cannot sync workouts: No user logged in')
    return
  }
  
  const cacheKey = `${STORAGE_KEYS.WORKOUTS}_${userId}`
  storage.set(cacheKey, data)
  await setDoc(doc(db, 'users', userId, 'data', 'workouts'), data)
}

export const loadWorkouts = async () => {
  const userId = getUserId()
  if (!userId) {
    console.warn('Cannot load workouts: No user logged in')
    return defaultWorkouts
  }

  const cacheKey = `${STORAGE_KEYS.WORKOUTS}_${userId}`
  let localData = storage.get(cacheKey)
  if (localData) {
    console.log('Loaded workouts from cache for user:', userId)
    return localData
  }
  
  try {
    const docRef = await getDoc(doc(db, 'users', userId, 'data', 'workouts'))
    if (docRef.exists()) {
      const data = docRef.data()
      storage.set(cacheKey, data)
      console.log('Loaded workouts from Firestore for user:', userId)
      return data
    }
  } catch (error) {
    console.error('Error loading workouts from Firestore:', error)
  }
  
  console.log('Initializing default workouts for user:', userId)
  await syncWorkouts(defaultWorkouts)
  return defaultWorkouts
}

// Schedule
export const syncSchedule = async (data) => {
  const userId = getUserId()
  if (!userId) return
  
  const cacheKey = `${STORAGE_KEYS.SCHEDULE}_${userId}`
  storage.set(cacheKey, data)
  await setDoc(doc(db, 'users', userId, 'data', 'schedule'), data)
}

export const loadSchedule = async () => {
  const userId = getUserId()
  if (!userId) return { skippedDays: [] }

  const cacheKey = `${STORAGE_KEYS.SCHEDULE}_${userId}`
  let localData = storage.get(cacheKey)
  if (localData) return localData
  
  try {
    const docRef = await getDoc(doc(db, 'users', userId, 'data', 'schedule'))
    if (docRef.exists()) {
      const data = docRef.data()
      storage.set(cacheKey, data)
      return data
    }
  } catch (error) {
    console.error('Error loading schedule:', error)
  }
  
  const defaultSchedule = { skippedDays: [] }
  await syncSchedule(defaultSchedule)
  return defaultSchedule
}

// Food
export const syncFood = async (dateKey, data) => {
  const userId = getUserId()
  if (!userId) return
  
  const cacheKey = `${STORAGE_KEYS.FOOD_PREFIX}${userId}_${dateKey}`
  storage.set(cacheKey, data)
  await setDoc(doc(db, 'users', userId, 'food', dateKey), data)
}

export const loadFood = async (dateKey) => {
  const userId = getUserId()
  if (!userId) return { breakfast: [], lunch: [], dinner: [], calorieGoal: 2000, proteinGoal: 150 }

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
  
  return { breakfast: [], lunch: [], dinner: [], calorieGoal: 2000, proteinGoal: 150 }
}

// Food Library
export const syncFoodList = async (data) => {
  const userId = getUserId()
  if (!userId) return
  
  const cacheKey = `${STORAGE_KEYS.FOOD_LIST}_${userId}`
  storage.set(cacheKey, data)
  await setDoc(doc(db, 'users', userId, 'data', 'foodList'), { items: data })
}

export const loadFoodList = async () => {
  const userId = getUserId()
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

// Workout Progress
export const syncWorkoutProgress = async (dateKey, data) => {
  const userId = getUserId()
  if (!userId) return
  
  const cacheKey = `workout_progress_${userId}_${dateKey}`
  storage.set(cacheKey, data)
  await setDoc(doc(db, 'users', userId, 'workoutProgress', dateKey), data)
}

export const loadWorkoutProgress = async (dateKey) => {
  const userId = getUserId()
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

export const loadAllWorkoutProgress = async () => {
  const userId = getUserId()
  if (!userId) return {}

  const progress = {}
  try {
    const querySnapshot = await getDocs(collection(db, 'users', userId, 'workoutProgress'))
    querySnapshot.forEach((doc) => {
      progress[doc.id] = doc.data()
      const cacheKey = `workout_progress_${userId}_${doc.id}`
      storage.set(cacheKey, doc.data())
    })
  } catch (error) {
    console.error('Error loading all workout progress:', error)
  }
  
  return progress
}

export const loadAllFoodProgress = async () => {
  const userId = getUserId()
  if (!userId) return {}

  const progress = {}
  try {
    const querySnapshot = await getDocs(collection(db, 'users', userId, 'food'))
    querySnapshot.forEach((doc) => {
      progress[doc.id] = doc.data()
      const cacheKey = `${STORAGE_KEYS.FOOD_PREFIX}${userId}_${doc.id}`
      storage.set(cacheKey, doc.data())
    })
  } catch (error) {
    console.error('Error loading all food progress:', error)
  }
  
  return progress
}
// Workout Overrides (manual day changes)
export const syncWorkoutOverrides = async (data) => {
  const userId = getUserId()
  if (!userId) return
  
  const cacheKey = `workout_overrides_${userId}`
  storage.set(cacheKey, data)
  await setDoc(doc(db, 'users', userId, 'data', 'workoutOverrides'), data)
}

export const loadWorkoutOverrides = async () => {
  const userId = getUserId()
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
    console.error('Error loading workout overrides:', error)
  }
  
  return {}
}