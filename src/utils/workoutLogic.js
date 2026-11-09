const WORKOUT_ROTATION = [
  'Pull',
  'Push',
  'Legs'
];

export const DEFAULT_PROFILE = {
  name: '',
  units: 'lb',
  calorieGoal: 2000,
  proteinGoal: 130,
  carbGoal: 225,
  fatGoal: 67,
  sodiumGoal: 2300,
  sugarGoal: 50,
  preferredWaterGoal: 5,
  lastFoodLogDate: '',
}

export const getWorkoutOptions = () => ['Push', 'Pull', 'Legs'];
export const isFixedRestDay = () => false;

// Returns the next workout in the Push/Pull/Legs rotation after the last logged type.
// If nothing has been logged yet, returns the first in the rotation.
export const getNextWorkout = (lastLoggedType, overrideForToday) => {
  if (overrideForToday && WORKOUT_ROTATION.includes(overrideForToday)) return overrideForToday;
  if (!lastLoggedType || !WORKOUT_ROTATION.includes(lastLoggedType)) return WORKOUT_ROTATION[0];
  return WORKOUT_ROTATION[(WORKOUT_ROTATION.indexOf(lastLoggedType) + 1) % WORKOUT_ROTATION.length];
};
