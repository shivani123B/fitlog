// Workout library — each entry has a MET (Metabolic Equivalent of Task) value.
//
// MET formula:  calories per minute = (MET × weightKg × 3.5) / 200
// Total burn:   caloriesBurned      = calories_per_minute × durationMin
//
// MET source: Compendium of Physical Activities (Ainsworth et al.)

export const CATEGORY_ORDER = ["Cardio", "Strength", "Other"];

export const WORKOUT_LIBRARY = [
  // ── Cardio ─────────────────────────────────────────────────────────────────
  { name: "Walking (3 km/h)",      category: "Cardio",   met: 2.5  },
  { name: "Walking (5 km/h)",      category: "Cardio",   met: 3.5  },
  { name: "Jogging",               category: "Cardio",   met: 7.0  },
  { name: "Running (8 km/h)",      category: "Cardio",   met: 8.3  },
  { name: "Running (10 km/h)",     category: "Cardio",   met: 9.8  },
  { name: "Cycling (moderate)",    category: "Cardio",   met: 6.0  },
  { name: "Cycling (intense)",     category: "Cardio",   met: 10.0 },
  { name: "Treadmill (incline)",   category: "Cardio",   met: 8.0  },
  { name: "Stair climbing",        category: "Cardio",   met: 8.8  },
  { name: "Jump rope",             category: "Cardio",   met: 10.0 },
  // ── Strength ───────────────────────────────────────────────────────────────
  { name: "Weight lifting (light)",    category: "Strength", met: 3.0 },
  { name: "Weight lifting (moderate)", category: "Strength", met: 5.0 },
  { name: "Weight lifting (intense)",  category: "Strength", met: 6.0 },
  { name: "Bodyweight workout",        category: "Strength", met: 5.0 },
  { name: "Squats",                    category: "Strength", met: 5.0 },
  { name: "Lunges",                    category: "Strength", met: 4.0 },
  { name: "Pushups",                   category: "Strength", met: 4.5 },
  { name: "Crunches",                  category: "Strength", met: 3.8 },
  { name: "Planks",                    category: "Strength", met: 3.0 },
  { name: "Deadlifts",                 category: "Strength", met: 6.0 },
  // ── Other ──────────────────────────────────────────────────────────────────
  { name: "Yoga",      category: "Other", met: 3.0 },
  { name: "Pilates",   category: "Other", met: 3.5 },
  { name: "Zumba",     category: "Other", met: 6.5 },
  { name: "HIIT",      category: "Other", met: 8.0 },
  { name: "Swimming",  category: "Other", met: 7.0 },
  { name: "Badminton", category: "Other", met: 5.5 },
  { name: "Football",  category: "Other", met: 8.0 },
];

// Calories burned = (MET × weightKg × 3.5 / 200) × durationMin
export function calcCaloriesBurned(met, weightKg, durationMin) {
  return Math.round((met * weightKg * 3.5) / 200 * durationMin);
}
