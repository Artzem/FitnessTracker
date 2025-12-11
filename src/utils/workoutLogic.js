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
      name: 'Bench Press',
      sets: [
        { weight: '', reps: '8-12', completed: false, notes: '' },
        { weight: '', reps: '8-12', completed: false, notes: '' },
        { weight: '', reps: '8-12', completed: false, notes: '' }
      ]
    },
    { 
      name: 'Incline Dumbbell Press',
      sets: [
        { weight: '', reps: '10', completed: false, notes: '' },
        { weight: '', reps: '10', completed: false, notes: '' },
        { weight: '', reps: '10', completed: false, notes: '' }
      ]
    },
    { 
      name: 'Chest Fly Machine',
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
    },
    { 
      name: 'Tricep Overhead Extension',
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
      name: 'Squats',
      sets: [
        { weight: '', reps: '8-12', completed: false, notes: '' },
        { weight: '', reps: '8-12', completed: false, notes: '' },
        { weight: '', reps: '8-12', completed: false, notes: '' }
      ]
    },
    { 
      name: 'Leg Press',
      sets: [
        { weight: '', reps: '12', completed: false, notes: '' },
        { weight: '', reps: '12', completed: false, notes: '' },
        { weight: '', reps: '12', completed: false, notes: '' }
      ]
    },
    { 
      name: 'Hamstring Curl',
      sets: [
        { weight: '', reps: '12', completed: false, notes: '' },
        { weight: '', reps: '12', completed: false, notes: '' },
        { weight: '', reps: '12', completed: false, notes: '' }
      ]
    },
    { 
      name: 'Leg Extension',
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