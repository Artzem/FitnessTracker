export const getTodayWorkout = (today, skippedDays = []) => {
  const cycle = ['Chest & Triceps', 'Back & Biceps', 'Legs', 'Rest']
  const startDate = new Date('2025-01-01')
  const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24))
  const activeDays = daysDiff - skippedDays.filter(d => d < daysDiff).length
  const index = Math.abs(activeDays) % cycle.length
  return cycle[index]
}

export const defaultWorkouts = {
  'Chest & Triceps': [
    { 
      name: 'Warmup/Stretch',
      sets: [
        { weight: '', reps: '5-10 min', completed: false, notes: '' }
      ]
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
        { weight: 'Bodyweight', reps: '10-12', completed: false, notes: '' },
        { weight: 'Bodyweight', reps: '10-12', completed: false, notes: '' },
        { weight: 'Bodyweight', reps: '10-12', completed: false, notes: '' }
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
      name: 'Warmup (Treadmill/Stretches)',
      sets: [
        { weight: '', reps: '5-10 min', completed: false, notes: '' }
      ]
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