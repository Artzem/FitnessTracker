import { storage, STORAGE_KEYS } from './storage'
import { defaultWorkouts } from './workoutLogic'
import { getDateKey } from './date'

const db = {
  collection: (name) => ({
    doc: (id) => ({
      get: async () => {
        const key = `${name}/${id}`;
        const data = localStorage.getItem(key);
        return {
          exists: () => !!data,
          data: () => (data ? JSON.parse(data) : null)
        };
      },
      set: async (data) => {
        const key = `${name}/${id}`;
        localStorage.setItem(key, JSON.stringify(data));
      }
    })
  })
};

export const syncWorkouts = async (data) => {
  storage.set(STORAGE_KEYS.WORKOUTS, data)
  await db.collection('workouts').doc('main').set(data)
}

export const syncSchedule = async (data) => {
  storage.set(STORAGE_KEYS.SCHEDULE, data)
  await db.collection('schedule').doc('main').set(data)
}

export const syncFood = async (dateKey, data) => {
  storage.set(STORAGE_KEYS.FOOD_PREFIX + dateKey, data)
  await db.collection('food').doc(dateKey).set(data)
}

export const syncFoodList = async (data) => {
  storage.set(STORAGE_KEYS.FOOD_LIST, data)
  await db.collection('foods').doc('list').set(data)
}

export const syncWorkoutProgress = async (dateKey, data) => {
  const key = `workout_progress_${dateKey}`
  storage.set(key, data)
  await db.collection('workout_progress').doc(dateKey).set(data)
}

export const loadWorkouts = async () => {
  let localData = storage.get(STORAGE_KEYS.WORKOUTS)
  if (localData) return localData
  
  const docRef = await db.collection('workouts').doc('main').get()
  if (docRef.exists()) {
    const data = docRef.data()
    storage.set(STORAGE_KEYS.WORKOUTS, data)
    return data
  }
  
  await syncWorkouts(defaultWorkouts)
  return defaultWorkouts
}

export const loadSchedule = async () => {
  let localData = storage.get(STORAGE_KEYS.SCHEDULE)
  if (localData) return localData
  
  const docRef = await db.collection('schedule').doc('main').get()
  if (docRef.exists()) {
    const data = docRef.data()
    storage.set(STORAGE_KEYS.SCHEDULE, data)
    return data
  }
  
  const defaultSchedule = { skippedDays: [] }
  await syncSchedule(defaultSchedule)
  return defaultSchedule
}

export const loadFood = async (dateKey) => {
  let localData = storage.get(STORAGE_KEYS.FOOD_PREFIX + dateKey)
  if (localData) return localData
  
  const docRef = await db.collection('food').doc(dateKey).get()
  if (docRef.exists()) {
    const data = docRef.data()
    storage.set(STORAGE_KEYS.FOOD_PREFIX + dateKey, data)
    return data
  }
  
  return { items: [], calorieGoal: 2000, proteinGoal: 150 }
}

export const loadFoodList = async () => {
  let localData = storage.get(STORAGE_KEYS.FOOD_LIST)
  if (localData) return localData
  
  const docRef = await db.collection('foods').doc('list').get()
  if (docRef.exists()) {
    const data = docRef.data()
    storage.set(STORAGE_KEYS.FOOD_LIST, data)
    return data
  }
  
  return []
}

export const loadWorkoutProgress = async (dateKey) => {
  const key = `workout_progress_${dateKey}`
  let localData = storage.get(key)
  if (localData) return localData
  
  const docRef = await db.collection('workout_progress').doc(dateKey).get()
  if (docRef.exists()) {
    const data = docRef.data()
    storage.set(key, data)
    return data
  }
  
  return null
}

export const loadAllWorkoutProgress = async () => {
  const allKeys = Object.keys(localStorage).filter(key => key.startsWith('workout_progress_'))
  const progress = {}
  
  allKeys.forEach(key => {
    const dateKey = key.replace('workout_progress_', '')
    const data = storage.get(key)
    if (data) {
      progress[dateKey] = data
    }
  })
  
  return progress
}

export const loadAllFoodProgress = async () => {
  const allKeys = Object.keys(localStorage).filter(key => key.startsWith(STORAGE_KEYS.FOOD_PREFIX))
  const progress = {}
  
  allKeys.forEach(key => {
    const dateKey = key.replace(STORAGE_KEYS.FOOD_PREFIX, '')
    const data = storage.get(key)
    if (data) {
      progress[dateKey] = data
    }
  })
  
  return progress
}