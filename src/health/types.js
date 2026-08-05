export const HEALTH_PERMISSION_READ_TYPES = [
  'steps',
  'sleep',
  'heartRate',
  'restingHeartRate',
  'workouts',
  'calories',
  'heartRateVariability'
]

export const createEmptyHealthSummary = (date = new Date().toISOString()) => ({
  date,
  sleepHours: null,
  steps: null,
  averageHeartRate: null,
  restingHeartRate: null,
  activeCalories: null,
  workoutsYesterday: 0,
  hrv: null
})

export const createHealthAccessState = () => ({
  available: false,
  platform: 'web',
  connected: false,
  status: 'idle',
  reason: 'Health data is unavailable on this device.'
})
