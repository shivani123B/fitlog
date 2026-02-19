// Food library tagged by diet category.
//
// Tag system:
//   VG = Vegan (no animal products)
//   V  = Vegetarian / Lacto-veg (dairy OK, no eggs, no meat)
//   E  = Eggetarian (eggs + dairy OK, no meat/fish)
//   N  = Non-vegetarian (meat/fish OK)
//
// Diet category → allowed tags:
//   Vegan             → VG
//   Vegetarian        → VG, V
//   Eggetarian        → VG, V, E
//   Non-vegetarian    → VG, V, E, N
//   Prefer not to say → all
//   ""                → all (no preference set)

export const ALLOWED_TAGS = {
  "Vegan":              ["VG"],
  "Vegetarian":         ["VG", "V"],
  "Eggetarian":         ["VG", "V", "E"],
  "Non-vegetarian":     ["VG", "V", "E", "N"],
  "Prefer not to say":  ["VG", "V", "E", "N"],
  "":                   ["VG", "V", "E", "N"],
};

export function filterByDiet(items, dietCategory) {
  const allowed = ALLOWED_TAGS[dietCategory] ?? ["VG", "V", "E", "N"];
  return items.filter((item) => allowed.includes(item.tag));
}

// Each entry: { name, cal (kcal), protein (g), tag }
export const FOOD_LIBRARY = {
  breakfast: [
    { name: "Moong dal chilla (3) + green mint chutney",           cal: 310, protein: 18, tag: "VG" },
    { name: "Oats with almond milk + mixed nuts + banana",          cal: 370, protein: 13, tag: "VG" },
    { name: "Poha with peanuts, peas, and mixed veggies",           cal: 330, protein: 12, tag: "VG" },
    { name: "Whole wheat toast (2) + peanut butter + banana",       cal: 390, protein: 15, tag: "VG" },
    { name: "Idli (3) with sambar + coconut chutney",               cal: 350, protein: 14, tag: "VG" },
    { name: "Overnight oats + chia seeds + mixed berries",          cal: 320, protein: 10, tag: "VG" },
    { name: "Upma (semolina, 1 cup) + coconut chutney",             cal: 300, protein: 10, tag: "VG" },
    { name: "Besan chilla (2) with paneer filling + curd",          cal: 400, protein: 24, tag: "V"  },
    { name: "Paneer bhurji (100 g) + 2 whole wheat roti",           cal: 430, protein: 26, tag: "V"  },
    { name: "Greek yogurt (200 g) + granola + 1 seasonal fruit",    cal: 360, protein: 20, tag: "V"  },
    { name: "Veg omelette (3 eggs) + 1 whole wheat roti",           cal: 360, protein: 22, tag: "E"  },
    { name: "Sprouts salad (150 g) + 2 boiled eggs + black tea",    cal: 280, protein: 20, tag: "E"  },
    { name: "Egg white omelette (4 eggs) + 2 roti + veggies",       cal: 340, protein: 26, tag: "E"  },
    { name: "Chicken scramble (2 eggs + 50 g chicken) + toast",     cal: 410, protein: 35, tag: "N"  },
    { name: "Tuna salad sandwich on whole wheat bread",             cal: 370, protein: 32, tag: "N"  },
  ],
  lunch: [
    { name: "Brown rice + dal + mixed sabzi + fresh salad",         cal: 530, protein: 18, tag: "VG" },
    { name: "Rajma chawal + onion-tomato-cucumber salad",           cal: 550, protein: 22, tag: "VG" },
    { name: "Quinoa + chickpea salad bowl with roasted veggies",    cal: 480, protein: 20, tag: "VG" },
    { name: "Tofu stir-fry (150 g) + 1 cup brown rice + salad",    cal: 440, protein: 24, tag: "VG" },
    { name: "Chana masala + 2 roti + onion salad",                  cal: 520, protein: 22, tag: "VG" },
    { name: "2 chapati + dal + paneer bhurji (80 g) + salad",       cal: 560, protein: 28, tag: "V"  },
    { name: "Chole masala + 2 roti + cucumber raita",               cal: 580, protein: 24, tag: "V"  },
    { name: "Palak paneer (200 g) + 2 roti + cucumber salad",       cal: 500, protein: 22, tag: "V"  },
    { name: "Dal makhani + 1 cup rice + 1 roti + salad",            cal: 540, protein: 20, tag: "V"  },
    { name: "Egg curry (2 eggs) + 2 whole wheat roti + salad",      cal: 470, protein: 26, tag: "E"  },
    { name: "Grilled chicken (150 g) + 1 cup brown rice + sabzi",   cal: 520, protein: 38, tag: "N"  },
    { name: "Fish curry (150 g) + 1 cup rice + salad",              cal: 490, protein: 34, tag: "N"  },
  ],
  dinner: [
    { name: "2 whole wheat roti + plain dal + mixed vegetables",    cal: 440, protein: 16, tag: "VG" },
    { name: "Vegetable soup + 2 roti + sabzi",                      cal: 390, protein: 14, tag: "VG" },
    { name: "Tofu stir-fry (150 g) + 2 roti + salad",              cal: 440, protein: 24, tag: "VG" },
    { name: "Lentil soup + roasted sweet potato + green salad",     cal: 410, protein: 18, tag: "VG" },
    { name: "Chana masala (150 g) + 2 roti + onion salad",          cal: 430, protein: 20, tag: "VG" },
    { name: "Moong dal khichdi + curd + pickle",                    cal: 400, protein: 18, tag: "V"  },
    { name: "Dal tadka + 2 roti + cucumber raita",                  cal: 430, protein: 18, tag: "V"  },
    { name: "Paneer tikka (100 g) + 1 roti + green salad",          cal: 420, protein: 24, tag: "V"  },
    { name: "Egg fried rice (2 eggs) + stir-fry vegetables",        cal: 460, protein: 22, tag: "E"  },
    { name: "Grilled chicken (150 g) + roasted veggies + quinoa",   cal: 460, protein: 40, tag: "N"  },
    { name: "Chicken soup + 2 slices whole wheat bread",            cal: 380, protein: 30, tag: "N"  },
    { name: "Fish tikka (150 g) + 1 cup brown rice + salad",        cal: 450, protein: 35, tag: "N"  },
  ],
  snacks: [
    { name: "Mixed nuts and seeds (30 g) + 1 seasonal fruit",       cal: 220, protein:  6, tag: "VG" },
    { name: "Roasted chana (40 g) + lemon + chaat masala",          cal: 160, protein: 10, tag: "VG" },
    { name: "Sprouts chaat (100 g) + tomato + onion",               cal: 150, protein: 10, tag: "VG" },
    { name: "Banana + 1 tbsp peanut butter",                        cal: 210, protein:  7, tag: "VG" },
    { name: "Hummus (3 tbsp) + cucumber and carrot sticks",         cal: 170, protein:  7, tag: "VG" },
    { name: "Rice cakes (3) + almond butter",                       cal: 200, protein:  6, tag: "VG" },
    { name: "Edamame (100 g) + sea salt",                           cal: 120, protein: 11, tag: "VG" },
    { name: "Greek yogurt (150 g) + drizzle of honey",              cal: 180, protein: 14, tag: "V"  },
    { name: "Paneer cubes (60 g) + cucumber sticks + lemon",        cal: 140, protein: 12, tag: "V"  },
    { name: "Cottage cheese (100 g) + berries + chia seeds",        cal: 175, protein: 14, tag: "V"  },
    { name: "Protein shake (1 scoop whey) + 200 ml milk",           cal: 210, protein: 28, tag: "V"  },
    { name: "2 boiled eggs + rock salt + pepper",                   cal: 155, protein: 13, tag: "E"  },
    { name: "Egg whites (4) + bell pepper stir-fry",                cal: 120, protein: 18, tag: "E"  },
  ],
};
