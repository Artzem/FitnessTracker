import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { generateStartingPlan, GOAL_LABELS, EXPERIENCE_LABELS, EQUIPMENT_LABELS } from '../utils/planGenerator'
import { syncTrainingProfile, syncWorkouts } from '../utils/dataSync'

const STEPS = ['You', 'Body', 'Goal', 'Target', 'Experience', 'Equipment', 'Schedule']

const GOALS = [
  { value: 'lose_fat',          label: 'Cut — Lose Fat',        desc: 'Burn fat, preserve muscle, improve body composition' },
  { value: 'build_muscle',      label: 'Bulk — Build Muscle',   desc: 'Gain size and definition through progressive overload' },
  { value: 'gain_strength',     label: 'Get Stronger',          desc: 'Focus on compound lifts and moving heavier weight' },
  { value: 'improve_endurance', label: 'Improve Endurance',     desc: 'Higher rep training and cardiovascular conditioning' },
  { value: 'general_fitness',   label: 'General Fitness',       desc: 'Balanced training for overall health and athleticism' },
]

const EXPERIENCES = [
  { value: 'beginner',     label: 'Beginner',     desc: 'Less than 1 year of consistent training' },
  { value: 'intermediate', label: 'Intermediate', desc: '1–3 years of regular training' },
  { value: 'advanced',     label: 'Advanced',     desc: '3+ years with structured programming' },
]

const EQUIPMENTS = [
  { value: 'full_gym',   label: 'Full Gym',       desc: 'Barbells, cables, machines, and dumbbells' },
  { value: 'home_gym',   label: 'Home Gym',        desc: 'Dumbbells and basic equipment at home' },
  { value: 'bodyweight', label: 'Bodyweight Only', desc: 'No equipment — push-ups, pull-ups, squats' },
]

const DAYS = [3, 4, 5, 6]
const WEEK_OPTIONS = [4, 8, 12, 16, 20, 24]

const EMPTY_FORM = {
  name: '', age: '', sex: 'Male',
  heightFeet: '', heightInches: '',
  bodyweight: '',
  goal: '',
  targetWeight: '',
  goalWeeks: '',
  experience: '',
  equipment: '',
  daysPerWeek: '',
  limitations: '',
}

function StepIndicator({ step }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-10 flex-wrap">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-black transition-all ${
            i < step ? 'bg-purple-500 text-white' :
            i === step ? 'bg-white text-slate-900' :
            'bg-white/10 text-gray-500'
          }`}>
            {i < step ? '✓' : i + 1}
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-0.5 w-6 rounded ${i < step ? 'bg-purple-500' : 'bg-white/10'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

function OptionCard({ selected, onClick, label, desc }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${
        selected
          ? 'bg-purple-500/20 border-purple-400 text-white'
          : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/30 hover:bg-white/10'
      }`}
    >
      <p className="font-bold text-lg">{label}</p>
      {desc && <p className="text-sm mt-1 opacity-70">{desc}</p>}
    </button>
  )
}

function FieldLabel({ children }) {
  return <label className="block text-xs uppercase tracking-[0.25em] text-purple-300 font-bold mb-2">{children}</label>
}

function Input({ type = 'text', value, onChange, placeholder, min, max }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      min={min}
      max={max}
      className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
    />
  )
}

export default function Onboarding() {
  const navigate = useNavigate()
  const { currentUser, completeOnboarding } = useAuth()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  const pick = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  const goalLabel = form.goal === 'lose_fat' ? 'lose' : (form.goal === 'build_muscle' || form.goal === 'gain_strength') ? 'gain' : null

  const canAdvance = () => {
    if (step === 0) return form.name.trim() && form.age && Number(form.age) >= 10 && Number(form.age) <= 100
    if (step === 1) return form.heightFeet && form.heightInches !== '' && form.bodyweight && Number(form.bodyweight) > 50
    if (step === 2) return !!form.goal
    if (step === 3) return true // target is optional — can skip
    if (step === 4) return !!form.experience
    if (step === 5) return !!form.equipment
    if (step === 6) return !!form.daysPerWeek
    return true
  }

  const next = () => {
    setError('')
    if (!canAdvance()) {
      setError('Please fill in all fields before continuing.')
      return
    }
    setStep((s) => s + 1)
  }

  const back = () => {
    setError('')
    setStep((s) => s - 1)
  }

  const finish = async () => {
    if (!currentUser) return
    setSaving(true)
    setError('')
    try {
      const { profile, workouts } = generateStartingPlan(form)
      await Promise.all([
        syncTrainingProfile(currentUser.uid, profile),
        syncWorkouts(currentUser.uid, workouts),
      ])
      completeOnboarding()
      navigate('/')
    } catch (err) {
      console.error('Onboarding save error:', err)
      setError('Could not save your plan. Check your connection and try again.')
      setSaving(false)
    }
  }

  const plan = step === 7 ? generateStartingPlan(form) : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">

        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-white tracking-tight">FitTrack</h1>
          <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mt-3" />
          <p className="text-gray-400 mt-4">
            {step < 7 ? `Step ${step + 1} of ${STEPS.length} — ${STEPS[step]}` : 'Your Starting Plan'}
          </p>
        </div>

        {step < 7 && <StepIndicator step={step} />}

        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8">

          {/* Step 0: Personal Info */}
          {step === 0 && (
            <div className="space-y-6">
              <h2 className="text-3xl font-black text-white">Tell us about yourself</h2>
              <div>
                <FieldLabel>First Name</FieldLabel>
                <Input value={form.name} onChange={set('name')} placeholder="Your name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Age</FieldLabel>
                  <Input type="number" value={form.age} onChange={set('age')} placeholder="25" min="10" max="100" />
                </div>
                <div>
                  <FieldLabel>Sex</FieldLabel>
                  <div className="grid grid-cols-3 gap-2">
                    {['Male', 'Female', 'Other'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => pick('sex', s)}
                        className={`py-4 rounded-xl font-semibold transition-all ${
                          form.sex === s
                            ? 'bg-purple-500/30 border-2 border-purple-400 text-purple-200'
                            : 'bg-white/5 border-2 border-white/10 text-gray-300 hover:border-white/30'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Body Metrics */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-3xl font-black text-white">Your body metrics</h2>
              <p className="text-gray-400">Used to calculate starting weights, calorie targets, and water goals.</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Height (feet)</FieldLabel>
                  <Input type="number" value={form.heightFeet} onChange={set('heightFeet')} placeholder="5" min="3" max="8" />
                </div>
                <div>
                  <FieldLabel>Height (inches)</FieldLabel>
                  <Input type="number" value={form.heightInches} onChange={set('heightInches')} placeholder="10" min="0" max="11" />
                </div>
              </div>
              <div>
                <FieldLabel>Current Weight (lbs)</FieldLabel>
                <Input type="number" value={form.bodyweight} onChange={set('bodyweight')} placeholder="160" min="50" max="600" />
              </div>
            </div>
          )}

          {/* Step 2: Goal */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-white">What is your primary goal?</h2>
              <p className="text-gray-400 mb-6">This shapes your rep ranges, calorie targets, and all daily nutrition limits.</p>
              {GOALS.map((g) => (
                <OptionCard
                  key={g.value}
                  selected={form.goal === g.value}
                  onClick={() => pick('goal', g.value)}
                  label={g.label}
                  desc={g.desc}
                />
              ))}
            </div>
          )}

          {/* Step 3: Target Weight & Timeline */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-black text-white">Set a weight goal</h2>
                <p className="text-gray-400 mt-2">
                  {goalLabel === 'lose'
                    ? `You currently weigh ${form.bodyweight} lbs. How low do you want to go?`
                    : goalLabel === 'gain'
                    ? `You currently weigh ${form.bodyweight} lbs. What's your target weight?`
                    : `Optional — set a target weight to track your progress over time.`}
                </p>
              </div>

              <div>
                <FieldLabel>Target Weight (lbs)</FieldLabel>
                <Input
                  type="number"
                  value={form.targetWeight}
                  onChange={set('targetWeight')}
                  placeholder={
                    goalLabel === 'lose'
                      ? String(Math.max(100, Number(form.bodyweight) - 20))
                      : goalLabel === 'gain'
                      ? String(Number(form.bodyweight) + 15)
                      : '160'
                  }
                  min="80"
                  max="600"
                />
                {form.targetWeight && form.bodyweight && (
                  <p className="text-purple-300 text-sm mt-2">
                    {Number(form.targetWeight) < Number(form.bodyweight)
                      ? `↓ Lose ${(Number(form.bodyweight) - Number(form.targetWeight)).toFixed(1)} lbs`
                      : Number(form.targetWeight) > Number(form.bodyweight)
                      ? `↑ Gain ${(Number(form.targetWeight) - Number(form.bodyweight)).toFixed(1)} lbs`
                      : 'Same as current weight'}
                  </p>
                )}
              </div>

              <div>
                <FieldLabel>Timeline</FieldLabel>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {WEEK_OPTIONS.map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => pick('goalWeeks', w)}
                      className={`py-3 rounded-xl font-bold text-sm transition-all ${
                        Number(form.goalWeeks) === w
                          ? 'bg-purple-500/30 border-2 border-purple-400 text-purple-200'
                          : 'bg-white/5 border-2 border-white/10 text-gray-300 hover:border-white/30'
                      }`}
                    >
                      {w}w
                    </button>
                  ))}
                </div>
                {form.targetWeight && form.goalWeeks && form.bodyweight && (
                  <p className="text-gray-400 text-sm mt-3">
                    That's about{' '}
                    <span className="text-white font-semibold">
                      {Math.abs((Number(form.targetWeight) - Number(form.bodyweight)) / Number(form.goalWeeks)).toFixed(1)} lbs/week
                    </span>
                    {' '}— {Math.abs((Number(form.targetWeight) - Number(form.bodyweight)) / Number(form.goalWeeks)) <= 1.5 ? 'a realistic pace.' : 'that may be aggressive — consider a longer timeline.'}
                  </p>
                )}
              </div>

              <p className="text-gray-500 text-sm">
                No specific target? Tap Continue — you can set this any time in your profile.
              </p>
            </div>
          )}

          {/* Step 4: Experience */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-white">Your experience level</h2>
              <p className="text-gray-400 mb-6">Sets your starting weights and volume. Starting light and progressing fast beats starting too heavy.</p>
              {EXPERIENCES.map((e) => (
                <OptionCard
                  key={e.value}
                  selected={form.experience === e.value}
                  onClick={() => pick('experience', e.value)}
                  label={e.label}
                  desc={e.desc}
                />
              ))}
            </div>
          )}

          {/* Step 5: Equipment */}
          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-white">Available equipment</h2>
              <p className="text-gray-400 mb-6">Determines which exercises are in your plan.</p>
              {EQUIPMENTS.map((eq) => (
                <OptionCard
                  key={eq.value}
                  selected={form.equipment === eq.value}
                  onClick={() => pick('equipment', eq.value)}
                  label={eq.label}
                  desc={eq.desc}
                />
              ))}
            </div>
          )}

          {/* Step 6: Schedule */}
          {step === 6 && (
            <div className="space-y-6">
              <h2 className="text-3xl font-black text-white">Your schedule</h2>
              <div>
                <FieldLabel>Days per week you can train</FieldLabel>
                <div className="grid grid-cols-4 gap-3">
                  {DAYS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => pick('daysPerWeek', d)}
                      className={`py-5 rounded-2xl font-black text-2xl transition-all ${
                        form.daysPerWeek === d
                          ? 'bg-purple-500/30 border-2 border-purple-400 text-purple-200'
                          : 'bg-white/5 border-2 border-white/10 text-gray-300 hover:border-white/30'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <p className="text-gray-500 text-sm mt-2">The app rotates Push / Pull / Legs across your training days.</p>
              </div>
              <div>
                <FieldLabel>Injuries or limitations (optional)</FieldLabel>
                <textarea
                  value={form.limitations}
                  onChange={set('limitations')}
                  rows={3}
                  placeholder="e.g. bad left knee, shoulder impingement, lower back issues"
                  className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-purple-400 transition-all resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 7: Plan Preview */}
          {step === 7 && plan && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-black text-white">
                  Your plan is ready{form.name ? `, ${form.name}` : ''}
                </h2>
                <p className="text-gray-400 mt-2">Built from your answers. You can edit anything later.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  ['Goal', GOAL_LABELS[plan.profile.goal] || plan.profile.goal],
                  ['Experience', EXPERIENCE_LABELS[plan.profile.experience]?.split(' ')[0] || plan.profile.experience],
                  ['Equipment', EQUIPMENT_LABELS[plan.profile.equipment]?.split(' ')[0] || plan.profile.equipment],
                  ['Days/week', String(plan.profile.daysPerWeek)],
                ].map(([label, value]) => (
                  <div key={label} className="bg-black/20 rounded-2xl p-4 border border-white/10">
                    <p className="text-gray-400 text-xs uppercase tracking-wider">{label}</p>
                    <p className="text-white font-bold mt-1">{value}</p>
                  </div>
                ))}
              </div>

              {plan.profile.targetWeight > 0 && plan.profile.goalWeeks > 0 && (
                <div className="bg-purple-500/10 rounded-2xl p-4 border border-purple-400/20">
                  <p className="text-purple-300 text-xs uppercase tracking-wider font-bold mb-1">Weight Goal</p>
                  <p className="text-white font-semibold">
                    {plan.profile.bodyweight} → {plan.profile.targetWeight} lbs in {plan.profile.goalWeeks} weeks
                    {' '}({Math.abs((plan.profile.targetWeight - plan.profile.bodyweight) / plan.profile.goalWeeks).toFixed(1)} lbs/week)
                  </p>
                  <p className="text-purple-200 text-sm mt-1">
                    The app will adjust your timeline automatically based on your actual progress.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  ['Calories', `${plan.calorieGoal} cal`],
                  ['Protein', `${plan.proteinGoal}g`],
                  ['Carbs', `${plan.carbGoal}g`],
                  ['Fat', `${plan.fatGoal}g`],
                  ['Sodium', `${plan.sodiumGoal}mg`],
                  ['Sugar limit', `${plan.sugarGoal}g`],
                ].map(([label, value]) => (
                  <div key={label} className="bg-black/20 rounded-2xl p-4 border border-white/10 text-center">
                    <p className="text-gray-400 text-xs uppercase tracking-wider">{label}</p>
                    <p className="text-white font-black text-xl mt-1">{value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-black/20 rounded-2xl p-4 border border-white/10 text-center">
                <p className="text-gray-400 text-xs uppercase tracking-wider">Daily Water</p>
                <p className="text-white font-black text-xl mt-1">{plan.waterGoal} bottles</p>
              </div>

              <div className="space-y-3">
                <p className="text-purple-300 text-xs uppercase tracking-[0.25em] font-bold">Starting Workout Plan</p>
                {['Push', 'Pull', 'Legs'].map((day) => (
                  <div key={day} className="bg-black/20 rounded-2xl p-4 border border-white/10">
                    <p className="text-white font-black mb-2">{day}</p>
                    <div className="space-y-1">
                      {plan.workouts[day]?.map((ex) => (
                        <div key={ex.name} className="flex items-center justify-between text-sm">
                          <span className="text-gray-300">{ex.name}</span>
                          <span className="text-gray-500">
                            {ex.sets.length} × {ex.sets[0].reps} @ {ex.sets[0].weight === 'BW' ? 'Bodyweight' : `${ex.sets[0].weight} lbs`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {plan.profile.limitations && (
                <div className="bg-amber-500/10 rounded-2xl p-4 border border-amber-400/20">
                  <p className="text-amber-300 text-xs uppercase tracking-wider font-bold mb-1">Noted Limitations</p>
                  <p className="text-amber-100 text-sm">{plan.profile.limitations}</p>
                </div>
              )}
            </div>
          )}

          {error && <p className="text-rose-300 text-sm mt-4">{error}</p>}

          <div className="flex items-center justify-between mt-8 gap-4">
            {step > 0 ? (
              <button
                type="button"
                onClick={back}
                disabled={saving}
                className="px-6 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all disabled:opacity-50"
              >
                Back
              </button>
            ) : <div />}

            {step < 6 && (
              <button
                type="button"
                onClick={next}
                className="flex-1 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white font-black text-lg transition-all"
              >
                Continue
              </button>
            )}

            {step === 6 && (
              <button
                type="button"
                onClick={next}
                className="flex-1 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white font-black text-lg transition-all"
              >
                Generate My Plan
              </button>
            )}

            {step === 7 && (
              <button
                type="button"
                onClick={finish}
                disabled={saving}
                className="flex-1 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-60 text-slate-950 font-black text-lg transition-all"
              >
                {saving ? 'Saving...' : 'Start Training'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
