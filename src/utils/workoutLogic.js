const WORKOUT_ROTATION = [
  'Pull',
  'Push',
  'Legs'
];

export const DEFAULT_PROFILE = {
  name: '',
  age: 25,
  sex: 'Male',
  heightFeet: 5,
  heightInches: 8,
  bodyweight: 160,
  goal: 'general_fitness',
  experience: 'beginner',
  equipment: 'full_gym',
  daysPerWeek: 4,
  limitations: '',
  units: 'lb',
  calorieGoal: 2000,
  proteinGoal: 130,
  carbGoal: 225,
  fatGoal: 67,
  sodiumGoal: 2300,
  sugarGoal: 50,
  preferredWaterGoal: 5,
  targetWeight: 0,
  goalWeeks: 0,
  goalStartDate: '',
  goalStartWeight: 0,
  lastFoodLogDate: '',
  onboardingComplete: false,
  lastWeighInDate: '',
}

export const getWorkoutForDate = (date, overrides = {}) => {
  const d = new Date(date);
  const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  
  if (WORKOUT_ROTATION.includes(overrides[dateKey])) return overrides[dateKey];

  // Anchor date used to keep the Push / Pull / Legs rotation stable over time.
  const startDate = new Date('2024-12-18');
  startDate.setHours(0, 0, 0, 0);
  const currentDate = new Date(date);
  currentDate.setHours(0, 0, 0, 0);
  
  let workoutDayCount = 0;
  let tempDate = new Date(startDate);
  
  while (tempDate < currentDate) {
    const tempKey = `${tempDate.getFullYear()}-${String(tempDate.getMonth() + 1).padStart(2, '0')}-${String(tempDate.getDate()).padStart(2, '0')}`;
    if (overrides[tempKey] === undefined || WORKOUT_ROTATION.includes(overrides[tempKey])) {
      workoutDayCount++;
    }
    tempDate.setDate(tempDate.getDate() + 1);
  }
  
  return WORKOUT_ROTATION[workoutDayCount % WORKOUT_ROTATION.length];
};

export const getTodayWorkout = (today, overrides = {}) => getWorkoutForDate(today, overrides);
export const getWorkoutOptions = () => ['Push', 'Pull', 'Legs'];
export const isFixedRestDay = () => false;

// Returns the next workout in the Push/Pull/Legs rotation after the last logged type.
// If nothing has been logged yet, returns the first in the rotation.
export const getNextWorkout = (lastLoggedType, overrideForToday) => {
  if (overrideForToday && WORKOUT_ROTATION.includes(overrideForToday)) return overrideForToday;
  if (!lastLoggedType || !WORKOUT_ROTATION.includes(lastLoggedType)) return WORKOUT_ROTATION[0];
  return WORKOUT_ROTATION[(WORKOUT_ROTATION.indexOf(lastLoggedType) + 1) % WORKOUT_ROTATION.length];
};

// Fallback template only — real plans are generated during onboarding
export const defaultWorkouts = {
  'Push': [
    { name: 'Bench Press', sets: [{ weight: '65', reps: '8-12', completed: false }, { weight: '65', reps: '8-12', completed: false }, { weight: '65', reps: '8-12', completed: false }] },
    { name: 'Overhead Press', sets: [{ weight: '35', reps: '8-12', completed: false }, { weight: '35', reps: '8-12', completed: false }, { weight: '35', reps: '8-12', completed: false }] },
    { name: 'Lateral Raise', sets: [{ weight: '10', reps: '12-15', completed: false }, { weight: '10', reps: '12-15', completed: false }, { weight: '10', reps: '12-15', completed: false }] },
    { name: 'Tricep Pushdown', sets: [{ weight: '25', reps: '10-12', completed: false }, { weight: '25', reps: '10-12', completed: false }, { weight: '25', reps: '10-12', completed: false }] }
  ],
  'Pull': [
    { name: 'Lat Pulldown', sets: [{ weight: '60', reps: '8-12', completed: false }, { weight: '60', reps: '8-12', completed: false }, { weight: '60', reps: '8-12', completed: false }] },
    { name: 'Seated Cable Row', sets: [{ weight: '60', reps: '8-12', completed: false }, { weight: '60', reps: '8-12', completed: false }, { weight: '60', reps: '8-12', completed: false }] },
    { name: 'Face Pull', sets: [{ weight: '20', reps: '12-15', completed: false }, { weight: '20', reps: '12-15', completed: false }, { weight: '20', reps: '12-15', completed: false }] },
    { name: 'Bicep Curl', sets: [{ weight: '25', reps: '10-12', completed: false }, { weight: '25', reps: '10-12', completed: false }, { weight: '25', reps: '10-12', completed: false }] }
  ],
  'Legs': [
    { name: 'Barbell Squat', sets: [{ weight: '75', reps: '8-12', completed: false }, { weight: '75', reps: '8-12', completed: false }, { weight: '75', reps: '8-12', completed: false }] },
    { name: 'Leg Press', sets: [{ weight: '110', reps: '10-12', completed: false }, { weight: '110', reps: '10-12', completed: false }, { weight: '110', reps: '10-12', completed: false }] },
    { name: 'Hamstring Curl', sets: [{ weight: '65', reps: '10-12', completed: false }, { weight: '65', reps: '10-12', completed: false }, { weight: '65', reps: '10-12', completed: false }] },
    { name: 'Calf Raise', sets: [{ weight: '95', reps: '12-15', completed: false }, { weight: '95', reps: '12-15', completed: false }, { weight: '95', reps: '12-15', completed: false }] }
  ],
  'Rest': []
};

const LOWER_BODY_KEYWORDS = ['squat', 'deadlift', 'leg press', 'split squat', 'lunge', 'calf']
const DUMBBELL_KEYWORDS = ['db', 'dumbbell']
const ISOLATION_KEYWORDS = ['curl', 'pushdown', 'extension', 'fly', 'raise', 'face pull', 'pulldown', 'row']
const GOAL_GAIN_KEYWORDS = ['gain', 'bulk', 'muscle', 'size']
const GOAL_CUT_KEYWORDS = ['cut', 'lose', 'lean', 'fat loss', 'drop']

export const cloneWorkout = (exercises = []) =>
  exercises.map((exercise) => ({
    ...exercise,
    sets: (exercise.sets || []).map((set) => ({
      ...set,
      completed: false,
      actualWeight: set.actualWeight || '',
      actualReps: set.actualReps || ''
    }))
  }))

const hasSameStructure = (left = [], right = []) => {
  if (left.length !== right.length) return false

  return left.every((exercise, idx) => {
    const other = right[idx]
    return exercise.name === other?.name && (exercise.sets?.length || 0) === (other?.sets?.length || 0)
  })
}

export const resolveWorkoutPlan = (template = [], adaptivePlan = []) => {
  if (hasSameStructure(template, adaptivePlan)) {
    return cloneWorkout(adaptivePlan)
  }

  return cloneWorkout(template)
}

export const formatHeight = (profile = DEFAULT_PROFILE) => `${profile.heightFeet}'${profile.heightInches}"`

export const parseWeightNumber = (weight) => {
  if (typeof weight === 'number') return weight
  if (!weight || typeof weight !== 'string') return null

  const trimmed = weight.trim().toUpperCase()
  if (trimmed === 'BW') return null

  const match = trimmed.match(/-?\d+(\.\d+)?/)
  return match ? Number(match[0]) : null
}

export const parseRepRange = (reps) => {
  if (typeof reps === 'number') {
    return { min: reps, max: reps }
  }

  if (!reps || typeof reps !== 'string') return { min: null, max: null }

  const matches = reps.match(/\d+/g)?.map(Number) || []
  if (matches.length >= 2) {
    return { min: matches[0], max: matches[1] }
  }

  if (matches.length === 1) {
    return { min: matches[0], max: matches[0] }
  }

  return { min: null, max: null }
}

const parseRepCount = (value, fallback = 0) => {
  if (typeof value === 'number') return value
  if (!value || typeof value !== 'string') return fallback

  const match = value.match(/\d+/)
  return match ? Number(match[0]) : fallback
}

const getProgressionStep = (exerciseName = '') => {
  const name = exerciseName.toLowerCase()

  if (LOWER_BODY_KEYWORDS.some((keyword) => name.includes(keyword))) return 10
  if (DUMBBELL_KEYWORDS.some((keyword) => name.includes(keyword))) return 5
  if (ISOLATION_KEYWORDS.some((keyword) => name.includes(keyword))) return 5

  return 5
}

const updateSetByAction = (set, exerciseName, action) => {
  const baseWeight = parseWeightNumber(set.actualWeight || set.weight)
  const step = getProgressionStep(exerciseName)

  if (baseWeight === null) {
    return {
      ...set,
      completed: false,
      actualWeight: '',
      actualReps: ''
    }
  }

  let nextWeight = baseWeight
  if (action === 'up') {
    nextWeight = baseWeight + step
  } else if (action === 'down') {
    nextWeight = Math.max(0, baseWeight - step)
  }

  return {
    ...set,
    weight: String(nextWeight),
    completed: false,
    actualWeight: '',
    actualReps: ''
  }
}

const getExerciseSummary = (exerciseName, action, feeling) => {
  if (action === 'up') {
    return `${exerciseName}: you earned more weight next time.`
  }

  if (action === 'down') {
    return `${exerciseName}: drop the load next time and rebuild with cleaner reps.`
  }

  if (feeling === 'rough') {
    return `${exerciseName}: stay here for now and clean up the effort before progressing.`
  }

  return `${exerciseName}: stay at this load and prove it again next time.`
}

const getGoalDirection = (goal = '') => {
  const normalizedGoal = String(goal).toLowerCase()
  if (GOAL_GAIN_KEYWORDS.some((keyword) => normalizedGoal.includes(keyword))) return 'gain'
  if (GOAL_CUT_KEYWORDS.some((keyword) => normalizedGoal.includes(keyword))) return 'cut'
  return 'maintain'
}

const getRecentExerciseHistory = (sessionHistory = [], workoutName, exerciseName) =>
  (sessionHistory || [])
    .filter((session) => session.workout === workoutName)
    .map((session) => session.exerciseResults?.find((result) => result.name === exerciseName))
    .filter(Boolean)
    .slice(0, 4)

const getConsistencyMetrics = (history = []) => {
  const completedSessions = history.filter((item) => item.completedAllReps && !item.skipped).length
  const skippedSessions = history.filter((item) => item.skipped).length
  const downSessions = history.filter((item) => item.action === 'down').length
  const upSessions = history.filter((item) => item.action === 'up').length
  const score = (completedSessions * 1.2) + (upSessions * 0.8) - (skippedSessions * 1.1) - (downSessions * 0.8)

  let label = 'New pattern'
  if (score >= 2.5) label = 'Very consistent'
  else if (score >= 1) label = 'Building consistency'
  else if (score <= -1.5) label = 'Needs consistency'

  return {
    score,
    label,
    completedSessions,
    skippedSessions,
    downSessions,
    upSessions
  }
}

const getBodyweightSignal = ({ goal, currentWeighIn, previousBodyweight, sessionHistory = [] }) => {
  const direction = getGoalDirection(goal)
  const recentWeighIns = (sessionHistory || [])
    .map((session) => Number(session.weighIn))
    .filter((value) => Number.isFinite(value))
    .slice(0, 3)

  const baselineWeight = recentWeighIns.length
    ? recentWeighIns.reduce((sum, value) => sum + value, 0) / recentWeighIns.length
    : Number(previousBodyweight || currentWeighIn || 0)

  const delta = baselineWeight ? currentWeighIn - baselineWeight : 0
  let score = 0
  let label = 'Bodyweight steady'

  if (direction === 'gain') {
    if (delta >= 0 && delta <= 1.5) {
      score = 0.55
      label = 'Bodyweight supports growth'
    } else if (delta < -1.5) {
      score = -0.75
      label = 'Bodyweight dropped fast for a gain goal'
    } else if (delta > 2) {
      score = -0.2
      label = 'Bodyweight jumped quickly'
    }
  } else if (direction === 'cut') {
    if (delta <= -0.25 && delta >= -2) {
      score = 0.55
      label = 'Bodyweight trend matches a cut'
    } else if (delta > 1) {
      score = -0.75
      label = 'Bodyweight moved away from a cut'
    } else if (delta < -2.5) {
      score = -0.3
      label = 'Bodyweight dropped very fast'
    }
  } else if (Math.abs(delta) <= 1) {
    score = 0.25
    label = 'Bodyweight stays stable'
  }

  return {
    score,
    label,
    delta: Number(delta.toFixed(2))
  }
}

const getEnhancedExerciseSummary = ({
  exerciseName,
  action,
  feeling,
  skipped,
  skipReason,
  consistency,
  bodyweightSignal
}) => {
  if (skipped) {
    if (action === 'down') {
      return `${exerciseName}: skipped (${skipReason || 'no reason logged'}), so back off next time and rebuild consistency.`
    }

    return `${exerciseName}: skipped (${skipReason || 'no reason logged'}), so hold this load and try to get it back next time.`
  }

  if (action === 'up') {
    return `${exerciseName}: reps, bodyweight, and consistency all support moving up next time.`
  }

  if (action === 'down') {
    return `${exerciseName}: recent performance says pull the load down and clean it up.`
  }

  if (feeling === 'rough') {
    return `${exerciseName}: stay here while recovery catches up. ${bodyweightSignal.label.toLowerCase()}.`
  }

  return `${exerciseName}: stay here and stack another clean session. ${consistency.label}.`
}

const getHealthRecoverySignal = (healthSummary = null) => {
  if (!healthSummary) {
    return {
      score: 0,
      label: 'No Apple Health recovery data yet',
      summary: 'Workout progression is using training data only right now.'
    }
  }

  let score = 0
  const messages = []

  if (typeof healthSummary.sleepHours === 'number') {
    if (healthSummary.sleepHours >= 7.5) {
      score += 0.8
      messages.push('sleep looks solid')
    } else if (healthSummary.sleepHours < 6) {
      score -= 0.9
      messages.push('sleep was short')
    }
  }

  if (typeof healthSummary.restingHeartRate === 'number') {
    if (healthSummary.restingHeartRate <= 58) {
      score += 0.35
      messages.push('resting heart rate is calm')
    } else if (healthSummary.restingHeartRate >= 68) {
      score -= 0.45
      messages.push('resting heart rate is elevated')
    }
  }

  if (typeof healthSummary.hrv === 'number') {
    if (healthSummary.hrv >= 55) {
      score += 0.45
      messages.push('HRV is supportive')
    } else if (healthSummary.hrv > 0 && healthSummary.hrv < 30) {
      score -= 0.45
      messages.push('HRV is low')
    }
  }

  if (typeof healthSummary.activeCalories === 'number' && healthSummary.activeCalories > 1200) {
    score -= 0.2
    messages.push('recent activity load was high')
  }

  const label = messages.length ? messages.join(', ') : 'Apple Health data is neutral'

  return {
    score,
    label,
    summary: messages.length
      ? `Apple Health says ${label}.`
      : 'Apple Health does not currently change the progression decision.'
  }
}

export const getFeelingLabel = (feeling) => {
  const labels = {
    great: 'Great',
    good: 'Good',
    okay: 'Okay',
    rough: 'Rough'
  }

  return labels[feeling] || 'Unknown'
}

export const buildNextWorkoutPlan = ({
  exercises = [],
  workoutName,
  feedback,
  previousBodyweight,
  sessionHistory = [],
  goal = '',
  healthSummary = null
}) => {
  const currentWeighIn = Number(feedback.weighIn || previousBodyweight || 0)
  const exerciseFeedback = feedback.exerciseFeedback || {}
  const bodyweightSignal = getBodyweightSignal({
    goal,
    currentWeighIn,
    previousBodyweight,
    sessionHistory
  })
  const healthRecoverySignal = getHealthRecoverySignal(healthSummary)
  const exerciseResults = []

  const nextExercises = exercises.map((exercise) => {
    const currentFeedback = exerciseFeedback[exercise.name] || {
      feeling: 'good',
      notes: '',
      skipped: false,
      skipReason: ''
    }
    const skipped = Boolean(currentFeedback.skipped)
    const skipReason = currentFeedback.skipReason || ''
    const loggedSets = (exercise.sets || []).filter((set) => set.completed)
    const analyzedSets = loggedSets.map((set) => {
      const { min, max } = parseRepRange(set.reps)
      const actualReps = parseRepCount(set.actualReps, max || min || 0)

      return {
        min,
        max,
        actualReps
      }
    })
    const recentExerciseHistory = getRecentExerciseHistory(sessionHistory, workoutName, exercise.name)
    const consistency = getConsistencyMetrics(recentExerciseHistory)

    const completedAllSets = loggedSets.length === (exercise.sets || []).length
    const hitTopRangeOnAllSets = analyzedSets.length > 0 && analyzedSets.every((set) => set.max !== null && set.actualReps >= set.max)
    const hitTopRangeOnMajority = analyzedSets.length > 0 && analyzedSets.filter((set) => set.max !== null && set.actualReps >= set.max).length >= Math.ceil(analyzedSets.length / 2)
    const missedFloorOnMultipleSets = analyzedSets.filter((set) => set.min !== null && set.actualReps < set.min).length >= Math.max(1, Math.ceil(analyzedSets.length / 2))
    const averageRepRatio = analyzedSets.length > 0
      ? analyzedSets.reduce((sum, set) => {
          const target = set.max || set.min || 1
          return sum + (target ? (set.actualReps / target) : 0)
        }, 0) / analyzedSets.length
      : 0

    let action = 'stay'
    let readinessScore = 0

    if (skipped) {
      const skipReasonText = skipReason.toLowerCase()
      if (
        skipReasonText.includes('pain') ||
        skipReasonText.includes('injur') ||
        consistency.skippedSessions >= 2
      ) {
        action = 'down'
      }
    } else {
      if (completedAllSets) readinessScore += 1
      if (hitTopRangeOnAllSets) readinessScore += 1.4
      else if (hitTopRangeOnMajority) readinessScore += 0.8

      if (averageRepRatio >= 1.05) readinessScore += 0.7
      else if (averageRepRatio >= 1) readinessScore += 0.35
      else if (averageRepRatio < 0.9) readinessScore -= 0.8

      if (missedFloorOnMultipleSets) readinessScore -= 1.6

      if (currentFeedback.feeling === 'great') readinessScore += 1
      else if (currentFeedback.feeling === 'good') readinessScore += 0.45
      else if (currentFeedback.feeling === 'rough') readinessScore -= 1.15

      readinessScore += Math.max(-1.3, Math.min(1.3, consistency.score * 0.35))
      readinessScore += bodyweightSignal.score
      readinessScore += healthRecoverySignal.score

      if (readinessScore >= 2.5) {
        action = 'up'
      } else if (readinessScore <= -1.25) {
        action = 'down'
      }
    }

    exerciseResults.push({
      name: exercise.name,
      action,
      shouldIncrease: action === 'up',
      feeling: currentFeedback.feeling,
      completedAllReps: !skipped && completedAllSets && !missedFloorOnMultipleSets,
      skipped,
      skipReason,
      notes: currentFeedback.notes || '',
      readinessScore: Number(readinessScore.toFixed(2)),
      consistencyScore: Number(consistency.score.toFixed(2)),
      consistencyLabel: consistency.label,
      bodyweightSignal: bodyweightSignal.label,
      healthSignal: healthRecoverySignal.label,
      summary: getEnhancedExerciseSummary({
        exerciseName: exercise.name,
        action,
        feeling: currentFeedback.feeling,
        skipped,
        skipReason,
        consistency,
        bodyweightSignal
      })
    })

    return {
      ...exercise,
      sets: (exercise.sets || []).map((set) => updateSetByAction(set, exercise.name, action))
    }
  })

  const upCount = exerciseResults.filter((item) => item.action === 'up').length
  const downCount = exerciseResults.filter((item) => item.action === 'down').length
  const stayCount = exerciseResults.filter((item) => item.action === 'stay').length
  const progressionScore = exerciseResults.length > 0
    ? exerciseResults.reduce((sum, item) => sum + (Number(item.readinessScore) || 0), 0) / exerciseResults.length
    : 0
  const skippedCount = exerciseResults.filter((item) => item.skipped).length
  const goalProgress = {
    status: progressionScore >= 1.25
      ? 'On track'
      : progressionScore <= -0.75
      ? 'Needs adjustment'
      : 'Building',
    summary: progressionScore >= 1.25
      ? `You are trending toward ${goal || 'your goal'} with solid reps, consistency, and bodyweight support.`
      : progressionScore <= -0.75
      ? `Progress is slipping right now. Recovery, bodyweight, or consistency needs attention before pushing harder.`
      : `You are still building momentum. Keep stacking clean reps and more consistent sessions.`,
    bodyweightSignal: bodyweightSignal.label,
    healthSignal: healthRecoverySignal.label,
    recoverySummary: healthRecoverySignal.summary,
    skippedCount,
    score: Number(progressionScore.toFixed(2))
  }
  const nextAction = `Next ${workoutName}: ${upCount} up, ${stayCount} stay, ${downCount} down.`

  return {
    nextExercises,
    summary: nextAction,
    exerciseResults,
    goalProgress
  }
}
