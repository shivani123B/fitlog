// Tier 1: USDA FoodData Central — generic / raw-food nutrition lookup.
// Searches Foundation and SR Legacy datasets (unbranded whole foods).
//
// API key setup:
//   Create a .env file at the project root with:
//     VITE_NUTRITION_API_KEY=your_key_here
//   Free key: https://fdc.nal.usda.gov/api-key-signup.html
//   Without a key the fallback "DEMO_KEY" is used (30 req/hour per IP).

const BASE_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";

// USDA nutrient IDs for the macros we track.
const NID = {
  calories: 1008, // Energy (kcal)
  proteinG: 1003, // Protein
  carbsG:   1005, // Carbohydrate, by difference
  fatG:     1004, // Total lipid (fat)
  fiberG:   1079, // Fiber, total dietary
};

function round1(n) {
  return Math.round((Number(n) || 0) * 10) / 10;
}

// Pull a single nutrient value out of the USDA foodNutrients array.
function getNutrient(nutrients, id) {
  const entry = nutrients.find((n) => n.nutrientId === id);
  return entry ? round1(entry.value) : 0;
}

/**
 * Search USDA FoodData Central for generic / whole foods matching `query`.
 *
 * @param {string} query  — e.g. "apple", "carrot", "olive oil", "turmeric"
 * @returns {Promise<Array>} — up to 8 items:
 *   { foodId, name, brand: null, per100g: { calories, proteinG, carbsG, fatG, fiberG } }
 */
export async function searchGenericFoods(query) {
  const apiKey = import.meta.env.VITE_NUTRITION_API_KEY || "DEMO_KEY";

  const params = new URLSearchParams({
    query:    query.trim(),
    api_key:  apiKey,
    dataType: "Foundation,SR Legacy",
    pageSize: "8",
  });

  const response = await fetch(`${BASE_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`USDA FoodData Central responded with status ${response.status}`);
  }

  const data  = await response.json();
  const foods = data.foods || [];

  return foods.map((food) => {
    const nutrients = food.foodNutrients || [];
    return {
      foodId: String(food.fdcId),
      name:   food.description || "Unknown food",
      brand:  null,
      per100g: {
        calories: getNutrient(nutrients, NID.calories),
        proteinG: getNutrient(nutrients, NID.proteinG),
        carbsG:   getNutrient(nutrients, NID.carbsG),
        fatG:     getNutrient(nutrients, NID.fatG),
        fiberG:   getNutrient(nutrients, NID.fiberG),
      },
    };
  });
}
