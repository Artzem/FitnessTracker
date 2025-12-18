// src/utils/workoutLogic.js

/**
 * Adjusted Rotation for Dec 18, 2025:
 * Based on 367 days diff from Dec 16, 2024.
 */
const WORKOUT_ROTATION = [
  'Back & Biceps',    // Index 0
  'Chest & Triceps',  // Index 1
  'Legs'              // Index 2 <--- TODAY (Dec 18, 2025) will land here
];

export const getWorkoutForDate = (date, overrides = {}) => {
  const d = new Date(date);
  const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  
  // 1. Manual Overrides
  if (overrides[dateKey]) {
    return overrides[dateKey];
  }

  // 2. Rotation Calculation
  const startDate = new Date('2024-12-16');
  startDate.setHours(0, 0, 0, 0);
  
  const currentDate = new Date(date);
  currentDate.setHours(0, 0, 0, 0);
  
  let workoutDayCount = 0;
  let tempDate = new Date(startDate);
  
  // Count non-rest days
  while (tempDate < currentDate) {
    const tempKey = `${tempDate.getFullYear()}-${String(tempDate.getMonth() + 1).padStart(2, '0')}-${String(tempDate.getDate()).padStart(2, '0')}`;
    const manualWorkout = overrides[tempKey];
    
    if (manualWorkout !== 'Rest') {
      workoutDayCount++;
    }
    tempDate.setDate(tempDate.getDate() + 1);
  }
  
  // Return workout based on day count
  return WORKOUT_ROTATION[workoutDayCount % WORKOUT_ROTATION.length];
};

export const getTodayWorkout = (today, overrides = {}) => {
  return getWorkoutForDate(today, overrides);
};

export const getWorkoutOptions = () => ['Rest', 'Chest & Triceps', 'Back & Biceps', 'Legs'];

export const isFixedRestDay = () => false;

export const defaultWorkouts = {
  'Chest & Triceps': [
    { name: 'Warmup/Stretch', sets: [{ weight: '', reps: '5-10 min', completed: false, notes: '' }] },
    { name: 'Bench Press', sets: [{ weight: '', reps: '8-12', completed: false, notes: '' }, { weight: '', reps: '8-12', completed: false, notes: '' }, { weight: '', reps: '8-12', completed: false, notes: '' }] },
    { name: 'Dips', sets: [{ weight: 'BW', reps: '10-12', completed: false, notes: '' }, { weight: 'BW', reps: '10-12', completed: false, notes: '' }, { weight: 'BW', reps: '10-12', completed: false, notes: '' }] },
    { name: 'Tricep Rope Pushdown', sets: [{ weight: '', reps: '12', completed: false, notes: '' }, { weight: '', reps: '12', completed: false, notes: '' }, { weight: '', reps: '12', completed: false, notes: '' }] }
  ],
  'Back & Biceps': [
    { name: 'Lat Pulldown', sets: [{ weight: '', reps: '10', completed: false, notes: '' }, { weight: '', reps: '10', completed: false, notes: '' }, { weight: '', reps: '10', completed: false, notes: '' }] },
    { name: 'Seated Row', sets: [{ weight: '', reps: '10', completed: false, notes: '' }, { weight: '', reps: '10', completed: false, notes: '' }, { weight: '', reps: '10', completed: false, notes: '' }] },
    { name: 'Bicep Curls', sets: [{ weight: '', reps: '12', completed: false, notes: '' }, { weight: '', reps: '12', completed: false, notes: '' }, { weight: '', reps: '12', completed: false, notes: '' }] }
  ],
  'Legs': [
    { name: 'Squats', sets: [{ weight: '', reps: '8-12', completed: false, notes: '' }, { weight: '', reps: '8-12', completed: false, notes: '' }, { weight: '', reps: '8-12', completed: false, notes: '' }] },
    { name: 'Romanian Deadlifts', sets: [{ weight: '', reps: '10', completed: false, notes: '' }, { weight: '', reps: '10', completed: false, notes: '' }, { weight: '', reps: '10', completed: false, notes: '' }] },
    { name: 'Calf Raises', sets: [{ weight: 'BW', reps: '15', completed: false, notes: '' }, { weight: 'BW', reps: '15', completed: false, notes: '' }, { weight: 'BW', reps: '15', completed: false, notes: '' }] }
  ],
  'Rest': []
};