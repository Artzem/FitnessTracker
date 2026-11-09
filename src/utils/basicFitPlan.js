// Basic-Fit plan: used as the default for new accounts and by Edit's "Load Basic-Fit plan" button
const exercise = (name, weight, reps, sets = 3) => ({
  name,
  sets: Array.from({ length: sets }, () => ({ weight, reps, completed: false })),
})

export const defaultWorkouts = {
  Legs: [
    exercise('Squat', '135', '6-8'),
    exercise('Leg Press', '180', '10-12'),
    exercise('Romanian Deadlift', '20', '10-12'),
    exercise('Seated Leg Curl', '130', '10-12'),
    exercise('Leg Extension', '130', '10-12'),
    exercise('Calf Raise', '145', '12-15'),
  ],
  Pull: [
    exercise('Pull-Ups', 'BW', '6-10'),
    exercise('Lat Pulldown', '110', '8-10'),
    exercise('Seated Cable Row', '100', '8-12'),
    exercise('Rear Delt Fly', '45', '12-15'),
    exercise('Straight Bar Curl', '50', '8-10'),
    exercise('Incline DB Curl', '15', '10-12', 2),
    exercise('Hammer Curl', '20', '10-12', 2),
  ],
  Push: [
    exercise('Bench Press', '135', '6-8'),
    exercise('Incline DB Press', '40', '8-10'),
    exercise('Shoulder Press', '70', '8-10'),
    exercise('Lateral Raise', '10', '12-15'),
    exercise('Tricep Pushdown', '35', '10-12'),
    exercise('Overhead Cable Extension', '30', '12', 2),
  ],
}
