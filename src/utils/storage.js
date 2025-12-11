export const STORAGE_KEYS = {
  WORKOUTS: 'fittrack_workouts',
  SCHEDULE: 'fittrack_schedule',
  FOOD_PREFIX: 'fittrack_food_',
  FOOD_LIST: 'fittrack_food_list'
}

export const storage = {
  get: (key) => {
    try {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : null
    } catch (e) {
      return null
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      console.error('Storage error:', e)
    }
  }
}