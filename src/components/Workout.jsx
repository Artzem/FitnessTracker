import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  loadAdaptiveTraining,
  loadTrainingProfile,
  loadWorkoutOverrides,
  loadWorkouts,
  loadWorkoutProgress,
  syncAdaptiveTraining,
  syncTrainingProfile,
  syncWorkoutProgress
} from '../utils/dataSync'
import {
  buildNextWorkoutPlan,
  formatHeight,
  getFeelingLabel,
  getNextWorkout,
  resolveWorkoutPlan
} from '../utils/workoutLogic'
import { getDateKey } from '../utils/date'
import { getCachedHealthSummary, getHealthAccessState, readHealthSummary, requestHealthPermissions } from '../health'

const defaultExerciseFeedback = (exerciseList = []) =>
  Object.fromEntries(
    exerciseList.map((exercise) => [exercise.name, { feeling: 'good', notes: '', skipped: false, skipReason: '' }])
  )

const SKIP_REASONS = ['No time', 'Too tired', 'Equipment taken', 'Pain / tweak', 'Other']

const formatDisplayedWeight = (weight) => {
  if (!weight) return 'Bodyweight'
  if (String(weight).toUpperCase() === 'BW') return 'Bodyweight'
  return `${weight} lbs`
}

export default function Workout() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [todayWorkout, setTodayWorkout] = useState('')
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState(null)
  const [adaptiveTraining, setAdaptiveTraining] = useState({ currentPlans: {}, sessionHistory: [] })
  const [sessionFeedback, setSessionFeedback] = useState(null)
  const [showCheckIn, setShowCheckIn] = useState(false)
  const [selectedSetByExercise, setSelectedSetByExercise] = useState({})
  const [activeExerciseKey, setActiveExerciseKey] = useState('')
  const [checkIn, setCheckIn] = useState({ weighIn: '164', notes: '', exerciseFeedback: {} })
  const [healthSummary, setHealthSummary] = useState(null)
  const [healthAccess, setHealthAccess] = useState({ available: false, platform: 'web', connected: false, status: 'idle', reason: '' })
  const [healthLoading, setHealthLoading] = useState(false)
  const [hasMarkedProgress, setHasMarkedProgress] = useState(false)
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [newExercise, setNewExercise] = useState({ name: '', sets: '3', reps: '8-12', weight: '' })

  const isExerciseLogged = (exercise, feedbackEntry) =>
    Boolean(feedbackEntry?.skipped) || exercise.sets?.every((set) => set.completed)

  useEffect(() => {
    const load = async () => {
      if (!currentUser) return

      try {
        const today = new Date()
        const dateKey = getDateKey(today)

        const [allWorkouts, trainingProfile, adaptiveState, savedProgress, overrides] = await Promise.all([
          loadWorkouts(currentUser.uid),
          loadTrainingProfile(currentUser.uid),
          loadAdaptiveTraining(currentUser.uid),
          loadWorkoutProgress(currentUser.uid, dateKey),
          loadWorkoutOverrides(currentUser.uid),
        ])

        // Use today's saved session type if already started, otherwise use override or advance from last logged
        const workoutName = (savedProgress?.workout && ['Push', 'Pull', 'Legs'].includes(savedProgress.workout))
          ? savedProgress.workout
          : getNextWorkout(adaptiveState.lastLoggedWorkoutType || '', overrides[dateKey])
        setTodayWorkout(workoutName)

        // If the user already logged sets today, don't re-mark progress
        const alreadyMarked = savedProgress?.exercises?.some(ex => ex.sets?.some(s => s.completed)) || false
        setHasMarkedProgress(alreadyMarked)

        const templateWorkout = allWorkouts[workoutName] || []
        let exerciseList = resolveWorkoutPlan(templateWorkout, adaptiveState.currentPlans?.[workoutName] || [])

        if (savedProgress?.exercises?.length) {
          exerciseList = savedProgress.exercises
        }

        setProfile(trainingProfile)
        setAdaptiveTraining(adaptiveState)
        const savedSessionFeedback = savedProgress?.sessionFeedback || null
        setSessionFeedback(savedSessionFeedback?.isComplete === false ? null : savedSessionFeedback)
        const draftFeedback = savedProgress?.sessionFeedback?.exerciseFeedback || defaultExerciseFeedback(exerciseList)

        setCheckIn({
          weighIn: String(savedProgress?.sessionFeedback?.weighIn || trainingProfile.bodyweight || 164),
          notes: savedProgress?.sessionFeedback?.notes || '',
          exerciseFeedback: draftFeedback
        })
        setSelectedSetByExercise(
          Object.fromEntries(exerciseList.map((exercise, index) => [exercise.name || String(index), 0]))
        )
        setActiveExerciseKey(exerciseList[0]?.name || '0')
        setExercises(exerciseList)
        calculateProgress(exerciseList, draftFeedback)
      } catch (error) {
        console.error('Error loading workout:', error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [currentUser])

  useEffect(() => {
    if (!exercises.length) return

    const hasActiveExercise = exercises.some((exercise, index) => (exercise.name || String(index)) === activeExerciseKey)
    if (!hasActiveExercise) {
      setActiveExerciseKey(exercises[0]?.name || '0')
    }
  }, [exercises, activeExerciseKey])

  useEffect(() => {
    const loadHealth = async () => {
      if (!currentUser) return

      setHealthSummary(getCachedHealthSummary(currentUser.uid))

      try {
        const accessState = await getHealthAccessState()
        setHealthAccess(accessState)

        if (accessState.connected) {
          setHealthLoading(true)
          const summary = await readHealthSummary({ userId: currentUser.uid, lookbackHours: 48 })
          setHealthSummary(summary)
        }
      } catch (error) {
        console.error('Error loading Apple Health state:', error)
        setHealthAccess((current) => ({
          ...current,
          status: 'error',
          reason: error.message || 'Could not load Apple Health.'
        }))
      } finally {
        setHealthLoading(false)
      }
    }

    loadHealth()
  }, [currentUser])

  const calculateProgress = (list, feedbackMap = checkIn.exerciseFeedback) => {
    let total = 0
    let done = 0
    list.forEach((exercise) => {
      const feedbackEntry = feedbackMap?.[exercise.name]
      if (feedbackEntry?.skipped) {
        total += exercise.sets?.length || 1
        done += exercise.sets?.length || 1
        return
      }

      exercise.sets?.forEach((set) => {
        total += 1
        if (set.completed) done += 1
      })
    })
    setProgress(total > 0 ? Math.round((done / total) * 100) : 0)
  }

  const persistWorkout = async (updatedExercises, nextFeedback = checkIn) => {
    if (!currentUser) return

    setSaving(true)
    try {
      const saves = [
        syncWorkoutProgress(currentUser.uid, getDateKey(new Date()), {
          workout: todayWorkout,
          exercises: updatedExercises,
          date: getDateKey(new Date()),
          sessionFeedback: nextFeedback ? { ...nextFeedback, isComplete: false } : null
        })
      ]

      // On first set logged this session, record this workout type so rotation advances next visit
      if (!hasMarkedProgress) {
        const anySetDone = updatedExercises.some(ex => ex.sets?.some(s => s.completed))
        if (anySetDone) {
          const nextAdaptive = { ...adaptiveTraining, lastLoggedWorkoutType: todayWorkout }
          saves.push(syncAdaptiveTraining(currentUser.uid, nextAdaptive))
          setAdaptiveTraining(nextAdaptive)
          setHasMarkedProgress(true)
        }
      }

      await Promise.all(saves)
    } catch (error) {
      console.error('Save failed:', error)
      alert(`Failed to save: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const updateExerciseFeedback = async (exerciseName, updates) => {
    const nextCheckIn = {
      ...checkIn,
      exerciseFeedback: {
        ...(checkIn.exerciseFeedback || {}),
        [exerciseName]: {
          feeling: 'good',
          notes: '',
          skipped: false,
          skipReason: '',
          ...(checkIn.exerciseFeedback?.[exerciseName] || {}),
          ...updates
        }
      }
    }

    setCheckIn(nextCheckIn)
    calculateProgress(exercises, nextCheckIn.exerciseFeedback)
    await persistWorkout(exercises, nextCheckIn)
  }

  const updateSet = async (exIdx, setIdx, updates) => {
    const updated = exercises.map((exercise, exerciseIndex) => (
      exerciseIndex === exIdx
        ? {
            ...exercise,
            sets: exercise.sets.map((set, currentSetIdx) => (
              currentSetIdx === setIdx ? { ...set, ...updates } : set
            ))
          }
        : exercise
    ))

    setExercises(updated)
    calculateProgress(updated)
    await persistWorkout(updated, checkIn)
  }

  const toggleSet = async (exIdx, setIdx) => {
    if (!currentUser) {
      alert('You seem to be logged out. Please re-login.')
      return
    }

    const currentSet = exercises[exIdx]?.sets?.[setIdx]
    const nextCompleted = !currentSet?.completed

    await updateSet(exIdx, setIdx, {
      completed: nextCompleted,
      actualWeight: currentSet?.actualWeight || currentSet?.weight || '',
      actualReps: currentSet?.actualReps || currentSet?.reps || ''
    })
  }

  const moveSelectedSet = (exerciseKey, direction, totalSets) => {
    setSelectedSetByExercise((current) => {
      const currentIndex = current[exerciseKey] || 0
      const nextIndex = Math.min(Math.max(currentIndex + direction, 0), totalSets - 1)
      return { ...current, [exerciseKey]: nextIndex }
    })
  }

  const toggleSkippedExercise = async (exerciseName, skipReason = SKIP_REASONS[0]) => {
    const currentFeedback = checkIn.exerciseFeedback?.[exerciseName] || {
      feeling: 'good',
      notes: '',
      skipped: false,
      skipReason: ''
    }

    await updateExerciseFeedback(exerciseName, {
      skipped: !currentFeedback.skipped,
      skipReason: currentFeedback.skipped ? '' : (currentFeedback.skipReason || skipReason)
    })
  }

  const connectAppleHealth = async () => {
    if (!currentUser) return

    setHealthLoading(true)
    try {
      const accessState = await requestHealthPermissions()
      setHealthAccess(accessState)

      if (accessState.connected) {
        const summary = await readHealthSummary({ userId: currentUser.uid, lookbackHours: 48 })
        setHealthSummary(summary)
      }
    } catch (error) {
      console.error('Apple Health permission request failed:', error)
      setHealthAccess((current) => ({
        ...current,
        status: 'error',
        reason: error.message || 'Apple Health access failed.'
      }))
    } finally {
      setHealthLoading(false)
    }
  }

  const addCustomExercise = async () => {
    const name = newExercise.name.trim()
    if (!name) return

    const setCount = Math.max(1, Number(newExercise.sets) || 3)
    const weight = newExercise.weight.trim() || 'BW'
    const reps = newExercise.reps.trim() || '8-12'

    const exercise = {
      name,
      custom: true,
      sets: Array.from({ length: setCount }, () => ({
        weight, reps, completed: false, actualWeight: '', actualReps: ''
      }))
    }

    const updatedExercises = [...exercises, exercise]

    const nextCheckIn = {
      ...checkIn,
      exerciseFeedback: {
        ...checkIn.exerciseFeedback,
        [name]: { feeling: 'good', notes: '', skipped: false, skipReason: '' }
      }
    }

    setExercises(updatedExercises)
    setSelectedSetByExercise((cur) => ({ ...cur, [name]: 0 }))
    setCheckIn(nextCheckIn)
    calculateProgress(updatedExercises, nextCheckIn.exerciseFeedback)
    setActiveExerciseKey(name)
    setNewExercise({ name: '', sets: '3', reps: '8-12', weight: '' })
    setShowAddExercise(false)

    await persistWorkout(updatedExercises, nextCheckIn)
  }

  const completeWorkout = async () => {
    if (!currentUser || !profile) return
    if (!checkIn.weighIn) {
      alert('Enter your post-workout weigh-in before saving.')
      return
    }

    const allExercisesHandled = exercises.every((exercise) => isExerciseLogged(exercise, checkIn.exerciseFeedback?.[exercise.name]))
    if (!allExercisesHandled) {
      alert('Log each exercise or mark it as "Didn’t do" before saving the workout.')
      return
    }

    setSaving(true)

    try {
      const nextPlanResult = buildNextWorkoutPlan({
        exercises,
        workoutName: todayWorkout,
        feedback: checkIn,
        previousBodyweight: profile.bodyweight,
        sessionHistory: adaptiveTraining.sessionHistory || [],
        goal: profile.goal,
        healthSummary
      })

      const nextAdaptiveTraining = {
        currentPlans: {
          ...(adaptiveTraining.currentPlans || {}),
          [todayWorkout]: nextPlanResult.nextExercises
        },
        lastLoggedWorkoutType: todayWorkout,
        sessionHistory: [
          {
            date: getDateKey(new Date()),
            workout: todayWorkout,
            weighIn: Number(checkIn.weighIn),
            notes: checkIn.notes,
            summary: nextPlanResult.summary,
            exerciseResults: nextPlanResult.exerciseResults,
            goalProgress: nextPlanResult.goalProgress
          },
          ...(adaptiveTraining.sessionHistory || [])
        ].slice(0, 50)
      }

      const newBodyweight = Number(checkIn.weighIn || profile.bodyweight)
      let adjustedGoalWeeks = profile.goalWeeks || 0

      if (
        profile.targetWeight > 0 &&
        profile.goalWeeks > 0 &&
        profile.goalStartDate &&
        profile.goalStartWeight > 0
      ) {
        const msPerWeek = 7 * 24 * 60 * 60 * 1000
        const weeksSinceStart = (Date.now() - new Date(profile.goalStartDate).getTime()) / msPerWeek
        if (weeksSinceStart >= 2) {
          const totalChange = profile.targetWeight - profile.goalStartWeight
          const actualChange = newBodyweight - profile.goalStartWeight
          const expectedChangeByNow = totalChange * (weeksSinceStart / profile.goalWeeks)
          // If actual progress is less than half of expected, extend the timeline
          if (Math.abs(expectedChangeByNow) > 0.5 && Math.abs(actualChange) < Math.abs(expectedChangeByNow) * 0.5) {
            const actualRatePerWeek = actualChange / weeksSinceStart
            if (Math.abs(actualRatePerWeek) > 0) {
              const weeksRemaining = Math.ceil((profile.targetWeight - newBodyweight) / actualRatePerWeek)
              adjustedGoalWeeks = Math.round(weeksSinceStart + Math.max(weeksRemaining, 1))
            }
          }
        }
      }

      const nextProfile = {
        ...profile,
        bodyweight: newBodyweight,
        lastWeighInDate: getDateKey(new Date()),
        goalWeeks: adjustedGoalWeeks,
      }

      const nextFeedback = {
        ...checkIn,
        weighIn: Number(checkIn.weighIn),
        summary: nextPlanResult.summary,
        exerciseResults: nextPlanResult.exerciseResults,
        goalProgress: nextPlanResult.goalProgress,
        isComplete: true
      }

      await Promise.all([
        syncAdaptiveTraining(currentUser.uid, nextAdaptiveTraining),
        syncTrainingProfile(currentUser.uid, nextProfile),
        syncWorkoutProgress(currentUser.uid, getDateKey(new Date()), {
          workout: todayWorkout,
          exercises,
          date: getDateKey(new Date()),
          sessionFeedback: nextFeedback
        })
      ])

      setAdaptiveTraining(nextAdaptiveTraining)
      setProfile(nextProfile)
      setSessionFeedback(nextFeedback)
      setCheckIn(nextFeedback)
      setShowCheckIn(false)
    } catch (error) {
      console.error('Error completing workout:', error)
      alert(`Could not save workout check-in: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 p-6 text-white">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => navigate('/')} className="text-blue-400 font-bold uppercase tracking-widest hover:text-blue-300">← Home</button>
          {saving && <span className="text-green-400 text-sm font-bold animate-pulse">SAVING...</span>}
        </div>

        <div className="bg-white/10 backdrop-blur-md p-10 rounded-3xl border border-white/20 mb-8 shadow-2xl">
          <h1 className="text-6xl font-black uppercase tracking-tighter italic mb-4">{todayWorkout}</h1>
          {profile && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div className="bg-black/20 rounded-2xl p-4 border border-white/10">
                <p className="text-xs uppercase tracking-[0.25em] text-blue-200">Profile</p>
                <p className="text-xl font-bold mt-1">{profile.age} / {profile.sex}</p>
              </div>
              <div className="bg-black/20 rounded-2xl p-4 border border-white/10">
                <p className="text-xs uppercase tracking-[0.25em] text-blue-200">Size</p>
                <p className="text-xl font-bold mt-1">{formatHeight(profile)} • {profile.bodyweight} lb</p>
              </div>
              <div className="bg-black/20 rounded-2xl p-4 border border-white/10">
                <p className="text-xs uppercase tracking-[0.25em] text-blue-200">Algorithm</p>
                <p className="text-sm font-semibold mt-1 text-gray-200">Uses real reps, bodyweight trend, and consistency to decide up, stay, or down.</p>
              </div>
            </div>
          )}
          <div className="w-full bg-black/40 rounded-full h-4">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-700" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 mb-8 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-200 font-bold">Apple Health</p>
              <h2 className="text-2xl font-black mt-2">Recovery data for the fitness coach</h2>
              <p className="text-gray-300 mt-3 max-w-3xl">
                The app only reads Apple Health on iPhone and only uses it for workout-generation decisions. Your raw health data is not sent to Firebase or anywhere else.
              </p>
            </div>

            {healthAccess.available && !healthAccess.connected && (
              <button
                onClick={connectAppleHealth}
                disabled={healthLoading}
                className="px-5 py-4 rounded-2xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-60 text-slate-950 font-black transition-all"
              >
                {healthLoading ? 'Connecting...' : 'Connect Apple Health'}
              </button>
            )}

            {healthAccess.connected && (
              <button
                onClick={connectAppleHealth}
                disabled={healthLoading}
                className="px-5 py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-black transition-all"
              >
                {healthLoading ? 'Refreshing...' : 'Refresh Health Data'}
              </button>
            )}
          </div>

          {!healthAccess.available && (
            <p className="text-sm text-gray-400 mt-4">{healthAccess.reason || 'Apple Health is only available in the native iPhone build.'}</p>
          )}

          {(healthAccess.connected || healthSummary) && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <div className="bg-black/20 rounded-2xl p-4 border border-white/10">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Sleep</p>
                <p className="text-2xl font-black mt-2">{healthSummary?.sleepHours ?? '--'}<span className="text-sm ml-1">hrs</span></p>
              </div>
              <div className="bg-black/20 rounded-2xl p-4 border border-white/10">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Steps</p>
                <p className="text-2xl font-black mt-2">{healthSummary?.steps ?? '--'}</p>
              </div>
              <div className="bg-black/20 rounded-2xl p-4 border border-white/10">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400">RHR / HRV</p>
                <p className="text-2xl font-black mt-2">
                  {healthSummary?.restingHeartRate ?? '--'}
                  <span className="text-sm mx-2 text-gray-500">/</span>
                  {healthSummary?.hrv ?? '--'}
                </p>
              </div>
              <div className="bg-black/20 rounded-2xl p-4 border border-white/10">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Calories / Workouts</p>
                <p className="text-2xl font-black mt-2">
                  {healthSummary?.activeCalories ?? '--'}
                  <span className="text-sm mx-2 text-gray-500">/</span>
                  {healthSummary?.workoutsYesterday ?? 0}
                </p>
              </div>
            </div>
          )}

          {healthAccess.reason && healthAccess.available && !healthAccess.connected && (
            <p className="text-sm text-amber-200 mt-4">{healthAccess.reason}</p>
          )}
        </div>

        {exercises.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
            <p className="text-2xl font-bold">Rest Day</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white/10 p-6 rounded-2xl border border-white/10">
              <label className="block text-xs uppercase tracking-[0.25em] text-blue-200 mb-3">Exercise</label>
              <select
                value={activeExerciseKey}
                onChange={(e) => setActiveExerciseKey(e.target.value)}
                className="w-full p-4 rounded-2xl bg-slate-900 border border-white/10 text-white outline-none focus:ring-2 focus:ring-blue-400"
              >
                {exercises.map((exercise, exerciseIndex) => {
                  const exerciseKey = exercise.name || String(exerciseIndex)
                  const feedback = checkIn.exerciseFeedback?.[exercise.name] || {}
                  const exerciseDone = isExerciseLogged(exercise, feedback)

                  return (
                    <option key={exerciseKey} value={exerciseKey} className="bg-slate-900">
                      {exercise.name}{exerciseDone ? ' • Done' : ''}
                    </option>
                  )
                })}
              </select>
            </div>

            {(() => {
              const exerciseIndex = Math.max(0, exercises.findIndex((exercise, index) => (exercise.name || String(index)) === activeExerciseKey))
              const exercise = exercises[exerciseIndex]
              if (!exercise) return null

              const exerciseKey = exercise.name || String(exerciseIndex)
              const selectedSetIndex = selectedSetByExercise[exerciseKey] || 0
              const selectedSet = exercise.sets?.[selectedSetIndex]
              const feedback = checkIn.exerciseFeedback?.[exercise.name] || {
                feeling: 'good',
                notes: '',
                skipped: false,
                skipReason: ''
              }
              const isSkipped = Boolean(feedback.skipped)
              const exerciseDone = isExerciseLogged(exercise, feedback)

              return (
                <div key={exerciseKey} className="bg-white/10 p-8 rounded-2xl border border-white/10">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                    <div className="flex flex-col gap-2">
                      <h3 className="text-2xl font-bold uppercase tracking-wide">{exercise.name}</h3>
                      <p className="text-sm text-gray-300">
                        {isSkipped
                          ? 'Marked as skipped for this workout.'
                          : 'Tap a set, then use the controls below to log what you actually did.'}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleSkippedExercise(exercise.name)}
                      className={`px-4 py-3 rounded-2xl font-black transition-all ${
                        isSkipped
                          ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                          : 'bg-white/10 text-white border border-white/10 hover:bg-white/20'
                      }`}
                    >
                      {isSkipped ? 'Undo Didn’t Do' : 'Didn’t Do'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {exercise.sets.map((set, setIndex) => {
                      const isSelected = selectedSetIndex === setIndex

                      return (
                        <button
                          key={setIndex}
                          onClick={() => setSelectedSetByExercise((current) => ({ ...current, [exerciseKey]: setIndex }))}
                          disabled={isSkipped}
                          className={`relative flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all text-center ${
                            isSkipped
                              ? 'bg-amber-500/10 border-amber-400/30 text-gray-300 opacity-70 cursor-not-allowed'
                              : set.completed
                              ? 'bg-green-500/20 border-green-400 shadow-[0_0_18px_rgba(34,197,94,0.18)]'
                              : isSelected
                              ? 'bg-blue-500/20 border-blue-300 shadow-[0_0_18px_rgba(96,165,250,0.16)]'
                              : 'bg-white/5 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <span className="text-xs uppercase tracking-[0.25em] text-gray-300">Set {setIndex + 1}</span>
                          <span className="text-3xl font-black mt-3">{formatDisplayedWeight(set.weight)}</span>
                          <span className="text-sm uppercase opacity-70 font-bold mt-2">{set.reps}</span>
                          <span className="text-xs text-cyan-200 mt-4">
                            Actual: {set.actualWeight || set.weight || 'BW'} / {set.actualReps || '--'}
                          </span>
                          {set.completed && <span className="mt-2 text-sm text-green-200 font-bold">✓ Logged</span>}
                          {isSkipped && <span className="mt-2 text-sm text-amber-200 font-bold">Skipped</span>}
                        </button>
                      )
                    })}
                  </div>

                  {isSkipped ? (
                    <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs uppercase tracking-[0.25em] text-amber-200 mb-2">Reason</label>
                          <select
                            value={feedback.skipReason || SKIP_REASONS[0]}
                            onChange={(e) => updateExerciseFeedback(exercise.name, { skipReason: e.target.value, skipped: true })}
                            className="w-full p-4 rounded-xl bg-black/20 border border-white/10 text-white outline-none focus:ring-2 focus:ring-amber-400"
                          >
                            {SKIP_REASONS.map((reason) => (
                              <option key={reason} value={reason} className="bg-slate-900">
                                {reason}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs uppercase tracking-[0.25em] text-amber-200 mb-2">Note</label>
                          <input
                            type="text"
                            value={feedback.notes}
                            onChange={(e) => updateExerciseFeedback(exercise.name, { notes: e.target.value, skipped: true })}
                            placeholder="Optional extra context"
                            className="w-full p-4 rounded-xl bg-black/20 border border-white/10 text-white outline-none focus:ring-2 focus:ring-amber-400"
                          />
                        </div>
                      </div>
                    </div>
                  ) : selectedSet && (
                    <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-5">
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <button
                          onClick={() => moveSelectedSet(exerciseKey, -1, exercise.sets.length)}
                          className="h-12 w-12 rounded-xl bg-white/10 hover:bg-white/20 text-2xl font-black disabled:opacity-40"
                          disabled={selectedSetIndex === 0}
                        >
                          ←
                        </button>
                        <div className="text-center">
                          <p className="text-sm uppercase tracking-[0.25em] text-blue-200">Selected Set</p>
                          <p className="text-xl font-black">Set {selectedSetIndex + 1}</p>
                        </div>
                        <button
                          onClick={() => moveSelectedSet(exerciseKey, 1, exercise.sets.length)}
                          className="h-12 w-12 rounded-xl bg-white/10 hover:bg-white/20 text-2xl font-black disabled:opacity-40"
                          disabled={selectedSetIndex === exercise.sets.length - 1}
                        >
                          →
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4">
                        <div>
                          <label className="block text-xs uppercase tracking-[0.25em] text-gray-300 mb-2">Actual Weight</label>
                          <input
                            type="text"
                            value={selectedSet.actualWeight || ''}
                            onChange={(e) => updateSet(exerciseIndex, selectedSetIndex, { actualWeight: e.target.value })}
                            placeholder={selectedSet.weight || 'BW'}
                            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:ring-2 focus:ring-blue-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs uppercase tracking-[0.25em] text-gray-300 mb-2">Actual Reps</label>
                          <input
                            type="text"
                            value={selectedSet.actualReps || ''}
                            onChange={(e) => updateSet(exerciseIndex, selectedSetIndex, { actualReps: e.target.value })}
                            placeholder={selectedSet.reps}
                            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:ring-2 focus:ring-blue-400"
                          />
                        </div>
                        <button
                          onClick={() => toggleSet(exerciseIndex, selectedSetIndex)}
                          className={`px-6 py-4 rounded-xl font-black transition-all ${
                            selectedSet.completed
                              ? 'bg-green-500 text-slate-950 hover:bg-green-400'
                              : 'bg-white text-slate-950 hover:bg-slate-100'
                          }`}
                        >
                          {selectedSet.completed ? 'Undo' : 'Log Set'}
                        </button>
                      </div>
                    </div>
                  )}

                  {exerciseDone && !sessionFeedback && (
                    <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.25em] text-emerald-200 font-bold">Finished Exercise</p>
                          <p className="text-lg font-black mt-2">How did {exercise.name} feel?</p>
                        </div>
                        <select
                          value={feedback.feeling}
                          onChange={(e) => updateExerciseFeedback(exercise.name, { feeling: e.target.value })}
                          className="rounded-xl bg-slate-900 border border-white/10 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-emerald-400"
                        >
                          <option value="great">Great</option>
                          <option value="good">Good</option>
                          <option value="okay">Okay</option>
                          <option value="rough">Rough</option>
                        </select>
                      </div>
                      <textarea
                        value={feedback.notes}
                        onChange={(e) => updateExerciseFeedback(exercise.name, { notes: e.target.value })}
                        rows="2"
                        placeholder="Optional note for next time"
                        className="w-full mt-4 p-3 rounded-xl bg-black/20 border border-white/10 text-white outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                    </div>
                  )}
                </div>
              )
            })()}

            {progress === 100 && !sessionFeedback && (
              <div className="bg-emerald-500/10 border border-emerald-400/20 rounded-3xl p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-emerald-300 text-sm uppercase tracking-[0.25em] font-bold">Workout Check-In</p>
                    <h2 className="text-3xl font-black mt-2">Finish the session</h2>
                    <p className="text-gray-300 mt-2">
                      Save your weigh-in and notes. The next workout uses the real set logs above plus how each exercise felt.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCheckIn((current) => !current)}
                    className="px-6 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black transition-all"
                  >
                    {showCheckIn ? 'Hide Finish' : 'Finish Workout'}
                  </button>
                </div>

                {showCheckIn && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                    <div>
                      <label className="block text-sm uppercase tracking-wider text-emerald-200 font-bold mb-2">Post-workout weigh-in</label>
                      <input
                        type="number"
                        value={checkIn.weighIn}
                        onChange={(e) => setCheckIn((current) => ({ ...current, weighIn: e.target.value }))}
                        className="w-full p-4 rounded-xl bg-black/20 border border-white/10 text-white outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm uppercase tracking-wider text-emerald-200 font-bold mb-2">Session Notes</label>
                      <input
                        type="text"
                        value={checkIn.notes}
                        onChange={(e) => setCheckIn((current) => ({ ...current, notes: e.target.value }))}
                        className="w-full p-4 rounded-xl bg-black/20 border border-white/10 text-white outline-none focus:ring-2 focus:ring-emerald-400"
                        placeholder="Optional: sleep, energy, soreness"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <button
                        onClick={completeWorkout}
                        className="w-full p-4 rounded-xl bg-white text-slate-900 font-black hover:bg-slate-100 transition-all"
                      >
                        Save Workout And Build Next One
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {sessionFeedback && (
              <div className="bg-cyan-500/10 border border-cyan-400/20 rounded-3xl p-6 sm:p-8">
                <p className="text-cyan-300 text-sm uppercase tracking-[0.25em] font-bold">Saved Check-In</p>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
                  <div className="bg-black/20 rounded-2xl p-4 border border-white/10">
                    <p className="text-gray-400 text-sm uppercase tracking-wider">Weigh-In</p>
                    <p className="text-2xl font-black mt-1">{sessionFeedback.weighIn} lb</p>
                  </div>
                  <div className="bg-black/20 rounded-2xl p-4 border border-white/10">
                    <p className="text-gray-400 text-sm uppercase tracking-wider">Up</p>
                    <p className="text-2xl font-black mt-1">{(sessionFeedback.exerciseResults || []).filter((item) => item.action === 'up').length}</p>
                  </div>
                  <div className="bg-black/20 rounded-2xl p-4 border border-white/10">
                    <p className="text-gray-400 text-sm uppercase tracking-wider">Stay</p>
                    <p className="text-2xl font-black mt-1">{(sessionFeedback.exerciseResults || []).filter((item) => item.action === 'stay').length}</p>
                  </div>
                  <div className="bg-black/20 rounded-2xl p-4 border border-white/10">
                    <p className="text-gray-400 text-sm uppercase tracking-wider">Down</p>
                    <p className="text-2xl font-black mt-1">{(sessionFeedback.exerciseResults || []).filter((item) => item.action === 'down').length}</p>
                  </div>
                </div>
                <p className="text-gray-200 mt-5">{sessionFeedback.summary}</p>
                {sessionFeedback.goalProgress && (
                  <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-cyan-200 font-bold">Goal Progress</p>
                        <p className="text-xl font-black mt-2">{sessionFeedback.goalProgress.status}</p>
                      </div>
                      <div className="text-sm text-cyan-100">
                        {sessionFeedback.goalProgress.bodyweightSignal}
                      </div>
                    </div>
                    <p className="text-gray-200 mt-3">{sessionFeedback.goalProgress.summary}</p>
                    {sessionFeedback.goalProgress.recoverySummary && (
                      <p className="text-gray-300 text-sm mt-2">{sessionFeedback.goalProgress.recoverySummary}</p>
                    )}
                  </div>
                )}
                <div className="space-y-3 mt-5">
                  {(sessionFeedback.exerciseResults || []).map((item) => (
                    <div key={item.name} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-bold text-white">{item.name}</p>
                        <span className={`text-xs font-black uppercase tracking-[0.2em] ${
                          item.action === 'up'
                            ? 'text-emerald-300'
                            : item.action === 'down'
                            ? 'text-rose-300'
                            : 'text-amber-300'
                        }`}>
                          {item.action || 'stay'}
                        </span>
                      </div>
                      <p className="text-gray-300 mt-2">{item.summary}</p>
                      <p className="text-gray-500 text-sm mt-2">
                        {item.skipped ? `Skipped • ${item.skipReason || 'No reason'}` : item.completedAllReps ? 'Full reps hit' : 'Rep target missed'} • {getFeelingLabel(item.feeling)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add custom exercise */}
        {!sessionFeedback && (
          <div className="mt-6">
            {!showAddExercise ? (
              <button
                onClick={() => setShowAddExercise(true)}
                className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 border-2 border-dashed border-white/20 hover:border-white/40 text-gray-300 hover:text-white font-bold transition-all"
              >
                + Add Exercise
              </button>
            ) : (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-xl font-black text-white">Add Exercise</h3>
                  <button onClick={() => setShowAddExercise(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-[0.25em] text-blue-200 font-bold mb-2">Exercise Name</label>
                    <input
                      type="text"
                      value={newExercise.name}
                      onChange={(e) => setNewExercise((cur) => ({ ...cur, name: e.target.value }))}
                      placeholder="e.g. Cable Curl, Dumbbell Row"
                      className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-400"
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs uppercase tracking-[0.25em] text-blue-200 font-bold mb-2">Sets</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={newExercise.sets}
                        onChange={(e) => setNewExercise((cur) => ({ ...cur, sets: e.target.value }))}
                        className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-[0.25em] text-blue-200 font-bold mb-2">Reps</label>
                      <input
                        type="text"
                        value={newExercise.reps}
                        onChange={(e) => setNewExercise((cur) => ({ ...cur, reps: e.target.value }))}
                        placeholder="8-12"
                        className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-[0.25em] text-blue-200 font-bold mb-2">Weight (lbs)</label>
                      <input
                        type="text"
                        value={newExercise.weight}
                        onChange={(e) => setNewExercise((cur) => ({ ...cur, weight: e.target.value }))}
                        placeholder="BW"
                        className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  </div>

                  <button
                    onClick={addCustomExercise}
                    disabled={!newExercise.name.trim()}
                    className="w-full py-4 rounded-xl bg-blue-500 hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-lg transition-all"
                  >
                    Add to Workout
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
