// Default workouts if Firebase has none
export const defaultWorkouts = {
  "Chest + Tri": [
    { name: "Bench Press", weight: "Barbell", sets: "4 x 8-10" },
    { name: "Incline DB Press", weight: "Dumbbell", sets: "3 x 10" },
    { name: "Chest Fly", weight: "Machine", sets: "3 x 12" },
    { name: "Tricep Pushdown", weight: "Cable", sets: "3 x 12" },
    { name: "Overhead Extension", weight: "Dumbbell", sets: "3 x 12" },
  ],
  "Back + Bi": [
    { name: "Lat Pulldown", weight: "Cable", sets: "4 x 10" },
    { name: "Barbell Row", weight: "Barbell", sets: "4 x 8" },
    { name: "Seated Cable Row", weight: "Cable", sets: "3 x 12" },
    { name: "DB Curl", weight: "Dumbbell", sets: "3 x 12" },
    { name: "Hammer Curl", weight: "Dumbbell", sets: "3 x 12" },
  ],
  Legs: [
    { name: "Squat", weight: "Barbell", sets: "4 x 8" },
    { name: "Leg Press", weight: "Machine", sets: "4 x 10" },
    { name: "Hamstring Curl", weight: "Machine", sets: "3 x 12" },
    { name: "Leg Extension", weight: "Machine", sets: "3 x 12" },
    { name: "Calf Raise", weight: "Machine", sets: "4 x 15" },
  ],
  Rest: [],
};

const workoutCycle = ["Chest + Tri", "Back + Bi", "Legs", "Rest"];

export function getTodayWorkout(date, skippedDays = []) {
  const startDate = new Date(2025, 0, 1);
  const diffDays = Math.floor((date - startDate) / (1000 * 60 * 60 * 24));
  const skippedCount = skippedDays.filter((d) => new Date(d) <= date && new Date(d) >= startDate).length;
  const index = (diffDays - skippedCount) % workoutCycle.length;
  const normalized = index < 0 ? (index + workoutCycle.length) % workoutCycle.length : index;
  return workoutCycle[normalized];
}
