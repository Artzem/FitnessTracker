const roundToFive = (n) => Math.round(n / 5) * 5
const clampMin = (n, min = 5) => Math.max(min, n)

// Starting weight as fraction of bodyweight per exercise key, per experience level
const WEIGHT_RATIOS = {
  bench_press:       { beginner: 0.38, intermediate: 0.65, advanced: 0.92 },
  overhead_press:    { beginner: 0.22, intermediate: 0.40, advanced: 0.58 },
  barbell_squat:     { beginner: 0.48, intermediate: 0.82, advanced: 1.15 },
  romanian_deadlift: { beginner: 0.48, intermediate: 0.80, advanced: 1.10 },
  barbell_curl:      { beginner: 0.14, intermediate: 0.22, advanced: 0.32 },
  lat_pulldown:      { beginner: 0.38, intermediate: 0.62, advanced: 0.85 },
  cable_row:         { beginner: 0.38, intermediate: 0.62, advanced: 0.85 },
  cable_fly:         { beginner: 0.14, intermediate: 0.24, advanced: 0.36 },
  tricep_pushdown:   { beginner: 0.14, intermediate: 0.24, advanced: 0.36 },
  face_pull:         { beginner: 0.10, intermediate: 0.17, advanced: 0.25 },
  hammer_curl:       { beginner: 0.10, intermediate: 0.16, advanced: 0.24 },
  leg_press:         { beginner: 0.70, intermediate: 1.20, advanced: 1.80 },
  leg_extension:     { beginner: 0.42, intermediate: 0.68, advanced: 0.95 },
  hamstring_curl:    { beginner: 0.40, intermediate: 0.65, advanced: 0.92 },
  machine_calf:      { beginner: 0.60, intermediate: 1.00, advanced: 1.40 },
  lateral_raise:     { beginner: 0.055, intermediate: 0.088, advanced: 0.13 },
  db_press:          { beginner: 0.095, intermediate: 0.165, advanced: 0.24 },
  db_fly:            { beginner: 0.055, intermediate: 0.095, advanced: 0.14 },
  db_shoulder_press: { beginner: 0.075, intermediate: 0.130, advanced: 0.19 },
  db_tricep_kick:    { beginner: 0.042, intermediate: 0.072, advanced: 0.10 },
  db_row:            { beginner: 0.115, intermediate: 0.200, advanced: 0.30 },
  db_rear_delt:      { beginner: 0.038, intermediate: 0.065, advanced: 0.10 },
  db_curl:           { beginner: 0.065, intermediate: 0.115, advanced: 0.17 },
  goblet_squat:      { beginner: 0.095, intermediate: 0.180, advanced: 0.30 },
  bulgarian_db:      { beginner: 0.075, intermediate: 0.135, advanced: 0.21 },
  db_lunge:          { beginner: 0.065, intermediate: 0.115, advanced: 0.17 },
  db_rdl:            { beginner: 0.115, intermediate: 0.200, advanced: 0.30 },
  db_calf:           { beginner: 0.115, intermediate: 0.200, advanced: 0.30 },
}

function getWeight(key, bodyweight, experience) {
  const ratio = WEIGHT_RATIOS[key]?.[experience] ?? 0.2
  return String(clampMin(roundToFive(bodyweight * ratio)))
}

const REP_RANGES = {
  build_muscle:      { min: 8,  max: 12 },
  gain_strength:     { min: 4,  max: 6  },
  lose_fat:          { min: 12, max: 15 },
  improve_endurance: { min: 15, max: 20 },
  general_fitness:   { min: 10, max: 12 },
}

const SET_COUNTS = { beginner: 3, intermediate: 3, advanced: 4 }

function makeRepsString(range) {
  return range.min === range.max ? String(range.min) : `${range.min}-${range.max}`
}

function makeSets(weight, reps, count) {
  return Array.from({ length: count }, () => ({
    weight,
    reps,
    completed: false,
    actualWeight: '',
    actualReps: '',
  }))
}

function makeExercise(name, weightKey, bodyweight, experience, repsRange, setCount) {
  const weight = weightKey === 'BW' ? 'BW' : getWeight(weightKey, bodyweight, experience)
  const reps = makeRepsString(repsRange)
  return { name, sets: makeSets(weight, reps, setCount) }
}

function buildExerciseList(definitions, bodyweight, experience, repsRange, setCount) {
  return definitions.map(([name, key]) =>
    makeExercise(name, key, bodyweight, experience, repsRange, setCount)
  )
}

const FULL_GYM_DEFS = {
  Push: [
    ['Bench Press', 'bench_press'],
    ['Cable Chest Fly', 'cable_fly'],
    ['Overhead Press', 'overhead_press'],
    ['Lateral Raise', 'lateral_raise'],
    ['Tricep Pushdown', 'tricep_pushdown'],
  ],
  Pull: [
    ['Lat Pulldown', 'lat_pulldown'],
    ['Seated Cable Row', 'cable_row'],
    ['Face Pull', 'face_pull'],
    ['Bicep Curl', 'barbell_curl'],
    ['Hammer Curl', 'hammer_curl'],
  ],
  Legs: [
    ['Barbell Squat', 'barbell_squat'],
    ['Leg Press', 'leg_press'],
    ['Leg Extension', 'leg_extension'],
    ['Romanian Deadlift', 'romanian_deadlift'],
    ['Hamstring Curl', 'hamstring_curl'],
    ['Calf Raise', 'machine_calf'],
  ],
}

const HOME_GYM_DEFS = {
  Push: [
    ['Dumbbell Bench Press', 'db_press'],
    ['Dumbbell Fly', 'db_fly'],
    ['Dumbbell Shoulder Press', 'db_shoulder_press'],
    ['Lateral Raise', 'lateral_raise'],
    ['Tricep Kickback', 'db_tricep_kick'],
  ],
  Pull: [
    ['Dumbbell Row', 'db_row'],
    ['Dumbbell Rear Delt Fly', 'db_rear_delt'],
    ['Dumbbell Bicep Curl', 'db_curl'],
    ['Hammer Curl', 'hammer_curl'],
  ],
  Legs: [
    ['Goblet Squat', 'goblet_squat'],
    ['Romanian Deadlift', 'db_rdl'],
    ['Bulgarian Split Squat', 'bulgarian_db'],
    ['Dumbbell Lunge', 'db_lunge'],
    ['Calf Raise', 'BW'],
  ],
}

const BODYWEIGHT_DEFS = {
  Push: [
    ['Push-Up', 'BW'],
    ['Pike Push-Up', 'BW'],
    ['Diamond Push-Up', 'BW'],
    ['Tricep Dip', 'BW'],
  ],
  Pull: [
    ['Pull-Up', 'BW'],
    ['Chin-Up', 'BW'],
    ['Inverted Row', 'BW'],
  ],
  Legs: [
    ['Bodyweight Squat', 'BW'],
    ['Lunge', 'BW'],
    ['Bulgarian Split Squat', 'BW'],
    ['Glute Bridge', 'BW'],
    ['Calf Raise', 'BW'],
  ],
}

const EQUIPMENT_DEFS = {
  full_gym: FULL_GYM_DEFS,
  home_gym: HOME_GYM_DEFS,
  bodyweight: BODYWEIGHT_DEFS,
}

function generateWorkouts(equipment, bodyweight, experience, goal) {
  const defs = EQUIPMENT_DEFS[equipment] || FULL_GYM_DEFS
  const repsRange = REP_RANGES[goal] || REP_RANGES.general_fitness
  const setCount = SET_COUNTS[experience] || 3
  const bw = Number(bodyweight) || 160

  return {
    Push: buildExerciseList(defs.Push, bw, experience, repsRange, setCount),
    Pull: buildExerciseList(defs.Pull, bw, experience, repsRange, setCount),
    Legs: buildExerciseList(defs.Legs, bw, experience, repsRange, setCount),
  }
}

function calculateNutrition(onboarding) {
  const { age, sex, heightFeet, heightInches, bodyweight, goal, daysPerWeek } = onboarding
  const heightCm = ((Number(heightFeet) * 12) + Number(heightInches)) * 2.54
  const weightKg = Number(bodyweight) * 0.453592
  const bmr = sex === 'Female'
    ? (10 * weightKg) + (6.25 * heightCm) - (5 * Number(age)) - 161
    : (10 * weightKg) + (6.25 * heightCm) - (5 * Number(age)) + 5

  const activityMultipliers = { 3: 1.375, 4: 1.375, 5: 1.55, 6: 1.55, 7: 1.725 }
  const tdee = Math.round(bmr * (activityMultipliers[Number(daysPerWeek)] || 1.375))

  const goalCalorieAdjust = {
    lose_fat: -400,
    build_muscle: +300,
    gain_strength: +200,
    improve_endurance: 0,
    general_fitness: 0,
  }

  const calorieGoal = Math.max(1200, tdee + (goalCalorieAdjust[goal] || 0))
  const proteinGoal = Math.round(Number(bodyweight) * 0.82)

  // Macro distribution by goal
  const carbPct  = { lose_fat: 0.38, build_muscle: 0.50, gain_strength: 0.48, improve_endurance: 0.55, general_fitness: 0.45 }
  const fatPct   = { lose_fat: 0.32, build_muscle: 0.28, gain_strength: 0.30, improve_endurance: 0.25, general_fitness: 0.30 }
  const carbGoal   = Math.round(calorieGoal * (carbPct[goal]  || 0.45) / 4)
  const fatGoal    = Math.round(calorieGoal * (fatPct[goal]   || 0.30) / 9)
  const sodiumGoal = goal === 'lose_fat' ? 2000 : 2300
  const sugarGoal  = goal === 'lose_fat' ? 30   : 50

  return { calorieGoal, proteinGoal, carbGoal, fatGoal, sodiumGoal, sugarGoal }
}

export const GOAL_LABELS = {
  build_muscle:      'Build Muscle',
  gain_strength:     'Gain Strength',
  lose_fat:          'Lose Fat',
  improve_endurance: 'Improve Endurance',
  general_fitness:   'General Fitness',
}

export const EXPERIENCE_LABELS = {
  beginner:     'Beginner (< 1 year)',
  intermediate: 'Intermediate (1–3 years)',
  advanced:     'Advanced (3+ years)',
}

export const EQUIPMENT_LABELS = {
  full_gym:   'Full Gym',
  home_gym:   'Home Gym (dumbbells)',
  bodyweight: 'Bodyweight Only',
}

export function generateStartingPlan(onboarding) {
  const {
    name, age, sex,
    heightFeet, heightInches, bodyweight,
    goal, experience, equipment, daysPerWeek, limitations,
    targetWeight, goalWeeks,
  } = onboarding

  const workouts = generateWorkouts(equipment, bodyweight, experience, goal)
  const { calorieGoal, proteinGoal, carbGoal, fatGoal, sodiumGoal, sugarGoal } = calculateNutrition(onboarding)
  const waterGoal = Math.max(3, Math.min(8, Math.round(Number(bodyweight) / 35)))

  const bw = Number(bodyweight) || 0
  const tw = Number(targetWeight) || 0
  const gw = Number(goalWeeks) || 0
  const hasGoal = tw > 0 && gw > 0

  const profile = {
    name: (name || '').trim(),
    age: Number(age),
    sex: sex || 'Male',
    heightFeet: Number(heightFeet),
    heightInches: Number(heightInches),
    bodyweight: bw,
    goal: goal || 'general_fitness',
    experience: experience || 'beginner',
    equipment: equipment || 'full_gym',
    daysPerWeek: Number(daysPerWeek),
    limitations: (limitations || '').trim(),
    units: 'lb',
    calorieGoal,
    proteinGoal,
    carbGoal,
    fatGoal,
    sodiumGoal,
    sugarGoal,
    preferredWaterGoal: waterGoal,
    targetWeight: tw,
    goalWeeks: gw,
    goalStartDate: hasGoal ? new Date().toISOString().split('T')[0] : '',
    goalStartWeight: hasGoal ? bw : 0,
    lastFoodLogDate: '',
    onboardingComplete: true,
    lastWeighInDate: '',
  }

  return { profile, workouts, calorieGoal, proteinGoal, carbGoal, fatGoal, sodiumGoal, sugarGoal, waterGoal }
}
