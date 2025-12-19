// src/utils/workoutLogic.js

const WORKOUT_ROTATION = [
  'Back & Biceps',    
  'Chest & Triceps',  
  'Legs'              
];

export const getWorkoutForDate = (date, overrides = {}) => {
  const d = new Date(date);
  const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  
  if (overrides[dateKey]) return overrides[dateKey];

  const startDate = new Date('2024-12-16');
  startDate.setHours(0, 0, 0, 0);
  const currentDate = new Date(date);
  currentDate.setHours(0, 0, 0, 0);
  
  let workoutDayCount = 0;
  let tempDate = new Date(startDate);
  
  while (tempDate < currentDate) {
    const tempKey = `${tempDate.getFullYear()}-${String(tempDate.getMonth() + 1).padStart(2, '0')}-${String(tempDate.getDate()).padStart(2, '0')}`;
    if (overrides[tempKey] !== 'Rest') workoutDayCount++;
    tempDate.setDate(tempDate.getDate() + 1);
  }
  
  return WORKOUT_ROTATION[workoutDayCount % WORKOUT_ROTATION.length];
};

export const getTodayWorkout = (today, overrides = {}) => getWorkoutForDate(today, overrides);
export const getWorkoutOptions = () => ['Rest', 'Chest & Triceps', 'Back & Biceps', 'Legs'];
export const isFixedRestDay = () => false;

export const defaultWorkouts = {
  'Chest & Triceps': [
    { name: 'Warmup/Stretch', sets: [{ weight: '', reps: '5-10 min', completed: false }] },
    { name: 'Bench Press', sets: [{ weight: '135', reps: '10', completed: false }, { weight: '155', reps: '8', completed: false }] },
    { name: 'Dips', sets: [{ weight: 'BW', reps: '10-12', completed: false }] },
    { name: 'Tricep Rope Pushdown', sets: [{ weight: '40', reps: '12', completed: false }] }
  ],
  'Back & Biceps': [
    { name: 'Lat Pulldown', sets: [{ weight: '100', reps: '10', completed: false }] },
    { name: 'Seated Row', sets: [{ weight: '100', reps: '10', completed: false }] },
    { name: 'Bicep Curls', sets: [{ weight: '25', reps: '12', completed: false }] }
  ],
  'Legs': [
    { 
      name: 'Warm-Up (Treadmill + Stretching)', 
      sets: [{ weight: '', reps: '5-10 min', completed: false }] 
    },
    { 
      name: 'Squats', 
      sets: [
        { weight: '135', reps: '8-10', completed: false },
        { weight: '155', reps: '8-10', completed: false },
        { weight: '165', reps: '6-8', completed: false }
      ] 
    },
    { 
      name: 'Hamstring Curls', 
      sets: [
        { weight: '100', reps: '10-12', completed: false },
        { weight: '110', reps: '10-12', completed: false },
        { weight: '120', reps: '8-10', completed: false }
      ] 
    },
    { 
      name: 'Leg Extensions', 
      sets: [
        { weight: '110', reps: '10-12', completed: false },
        { weight: '120', reps: '10-12', completed: false },
        { weight: '130', reps: '8-10', completed: false }
      ] 
    },
    { 
      name: 'Hip Abductors', 
      sets: [
        { weight: '100', reps: '12-15', completed: false },
        { weight: '110', reps: '12-15', completed: false },
        { weight: '120', reps: '12-15', completed: false }
      ] 
    },
    { 
      name: 'Calf Raises', 
      sets: [
        { weight: '135', reps: '15', completed: false },
        { weight: '155', reps: '12-15', completed: false },
        { weight: '165', reps: '10-12', completed: false }
      ] 
    }
  ],
  'Rest': []
};
