/**
 * Fixed rest days (0 = Sunday, 3 = Wednesday)
 */
const FIXED_REST_DAYS = [0, 3] // Sunday and Wednesday

/**
 * Workout rotation (excluding rest days)
 */
const WORKOUT_ROTATION = ['Chest & Triceps', 'Back & Biceps', 'Legs']

/**
 * Check if a date is a fixed rest day
 */
export const isFixedRestDay = (date) => {
  const dayOfWeek = new Date(date).getDay()
  return FIXED_REST_DAYS.includes(dayOfWeek)
}

/**
 * Get the workout for a specific date based on manual overrides and rotation
 */
export const getWorkoutForDate = (date, overrides = {}) => {
  const dateKey = getDateKeyFromDate(date)
  
  // Check if user manually set this day
  if (overrides[dateKey]) {
    return overrides[dateKey]
  }
  
  // Check if it's a fixed rest day
  if (isFixedRestDay(date)) {
    return 'Rest'
  }
  
  // Calculate position in workout rotation
  const startDate = new Date('2024-12-16') // Monday = Chest & Triceps
  startDate.setHours(0, 0, 0, 0)
  
  const currentDate = new Date(date)
  currentDate.setHours(0, 0, 0, 0)
  
  // Count workout days (excluding fixed rest days and manual rest days)
  let workoutDayCount = 0
  let tempDate = new Date(startDate)
  
  while (tempDate < currentDate) {
    const tempDateKey = getDateKeyFromDate(tempDate)
    const isManualRest = overrides[tempDateKey] === 'Rest'
    
    if (!isFixedRestDay(tempDate) && !isManualRest) {
      workoutDayCount++
    }
    
    tempDate.setDate(tempDate.getDate() + 1)
  }
  
  return WORKOUT_ROTATION[workoutDayCount % WORKOUT_ROTATION.length]
}

/**
 * Get today's workout
 */
export const getTodayWorkout = (today, overrides = {}) => {
  return getWorkoutForDate(today, overrides)
}

/**
 * Generate workout schedule for a date range
 */
export const generateSchedule = (startDate, endDate, overrides = {}) => {
  const schedule = []
  const current = new Date(startDate)
  current.setHours(0, 0, 0, 0)
  
  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)
  
  while (current <= end) {
    const dateKey = getDateKeyFromDate(current)
    const workout = getWorkoutForDate(current, overrides)
    
    schedule.push({
      date: new Date(current),
      dateKey: dateKey,
      workout: workout,
      isToday: dateKey === getDateKeyFromDate(new Date()),
      isPast: current < new Date().setHours(0, 0, 0, 0),
      isFixedRest: isFixedRestDay(current),
      isManualOverride: !!overrides[dateKey]
    })
    
    current.setDate(current.getDate() + 1)
  }
  
  return schedule
}

/**
 * Helper to get date key from date object
 */
function getDateKeyFromDate(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Get available workout options
 */
export const getWorkoutOptions = () => {
  return ['Rest', ...WORKOUT_ROTATION]
}

/**
 * Default exercises for each workout type
 */
export const defaultWorkouts = {
  'Chest & Triceps': [
    { 
      name: 'Warmup/Stretch',
      sets: [{ weight: '', reps: '5-10 min', completed: false, notes: '' }]
    },
    { 
      name: 'Bench Press',
      sets: [
        { weight: '', reps: '8-12', completed: false, notes: '' },
        { weight: '', reps: '8-12', completed: false, notes: '' },
        { weight: '', reps: '8-12', completed: false, notes: '' }
      ]
    },
    { 
      name: 'Chest Machine Press',
      sets: [
        { weight: '', reps: '10', completed: false, notes: '' },
        { weight: '', reps: '10', completed: false, notes: '' },
        { weight: '', reps: '10', completed: false, notes: '' }
      ]
    },
    { 
      name: 'Dips',
      sets: [
        { weight: 'BW', reps: '10-12', completed: false, notes: '' },
        { weight: 'BW', reps: '10-12', completed: false, notes: '' },
        { weight: 'BW', reps: '10-12', completed: false, notes: '' }
      ]
    },
    { 
      name: 'Seated Triceps Extension Machine',
      sets: [
        { weight: '', reps: '12', completed: false, notes: '' },
        { weight: '', reps: '12', completed: false, notes: '' },
        { weight: '', reps: '12', completed: false, notes: '' }
      ]
    },
    { 
      name: 'Chest Flys',
      sets: [
        { weight: '', reps: '12', completed: false, notes: '' },
        { weight: '', reps: '12', completed: false, notes: '' },
        { weight: '', reps: '12', completed: false, notes: '' }
      ]
    },
    { 
      name: 'Tricep Rope Pushdown',
      sets: [
        { weight: '', reps: '12', completed: false, notes: '' },
        { weight: '', reps: '12', completed: false, notes: '' },
        { weight: '', reps: '12', completed: false, notes: '' }
      ]
    }
  ],
  'Back & Biceps': [
    { 
      name: 'Lat Pulldown',
      sets: [
        { weight: '', reps: '10', completed: false, notes: '' },
        { weight: '', reps: '10', completed: false, notes: '' },
        { weight: '', reps: '10', completed: false, notes: '' }
      ]
    },
    { 
      name: 'Seated Row',
      sets: [
        { weight: '', reps: '10', completed: false, notes: '' },
        { weight: '', reps: '10', completed: false, notes: '' },
        { weight: '', reps: '10', completed: false, notes: '' }
      ]
    },
    { 
      name: 'Barbell Row',
      sets: [
        { weight: '', reps: '8-10', completed: false, notes: '' },
        { weight: '', reps: '8-10', completed: false, notes: '' },
        { weight: '', reps: '8-10', completed: false, notes: '' }
      ]
    },
    { 
      name: 'Dumbbell Bicep Curls',
      sets: [
        { weight: '', reps: '12', completed: false, notes: '' },
        { weight: '', reps: '12', completed: false, notes: '' },
        { weight: '', reps: '12', completed: false, notes: '' }
      ]
    },
    { 
      name: 'Hammer Curls',
      sets: [
        { weight: '', reps: '12', completed: false, notes: '' },
        { weight: '', reps: '12', completed: false, notes: '' },
        { weight: '', reps: '12', completed: false, notes: '' }
      ]
    }
  ],
  'Legs': [
    { 
      name: 'Warmup',
      sets: [{ weight: '', reps: '5-10 min', completed: false, notes: '' }]
    },
    { 
      name: 'Squats',
      sets: [
        { weight: '', reps: '8-12', completed: false, notes: '' },
        { weight: '', reps: '8-12', completed: false, notes: '' },
        { weight: '', reps: '8-12', completed: false, notes: '' }
      ]
    },
    { 
      name: 'Romanian Deadlifts',
      sets: [
        { weight: '', reps: '10', completed: false, notes: '' },
        { weight: '', reps: '10', completed: false, notes: '' },
        { weight: '', reps: '10', completed: false, notes: '' }
      ]
    },
    { 
      name: 'Leg Extensions',
      sets: [
        { weight: '', reps: '12', completed: false, notes: '' },
        { weight: '', reps: '12', completed: false, notes: '' },
        { weight: '', reps: '12', completed: false, notes: '' }
      ]
    },
    { 
      name: 'Hamstring Curls',
      sets: [
        { weight: '', reps: '12', completed: false, notes: '' },
        { weight: '', reps: '12', completed: false, notes: '' },
        { weight: '', reps: '12', completed: false, notes: '' }
      ]
    },
    { 
      name: 'Calf Raises',
      sets: [
        { weight: '', reps: '15', completed: false, notes: '' },
        { weight: '', reps: '15', completed: false, notes: '' },
        { weight: '', reps: '15', completed: false, notes: '' }
      ]
    }

  ],
  'Rest': []
}