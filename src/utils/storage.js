
export const STORAGE_KEYS = {
  WORKOUTS: 'fittrack_workouts',
  SCHEDULE: 'fittrack_schedule',
  FOOD_PREFIX: 'fittrack_food_',
  FOOD_LIST: 'fittrack_food_list',
  DAILY_HABITS: 'fittrack_daily_habits',
  USER_OVERRIDES: 'fittrack_workout_overrides',
  WORKOUT_PROGRESS: 'fittrack_workout_progress_',
  TRAINING_PROFILE: 'fittrack_training_profile',
  ADAPTIVE_TRAINING: 'fittrack_adaptive_training'
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
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key)
    } catch (e) {
      console.error('Storage error:', e)
    }
  }
}
