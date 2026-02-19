// Searches the Open Food Facts database (no API key required).
// Returns up to 8 normalized product results with per-100g macros.

const BASE_URL = "https://world.openfoodfacts.org/cgi/search.pl";

// Rounds a value to 1 decimal place; treats missing/NaN as 0.
function round1(n) {
  return Math.round((Number(n) || 0) * 10) / 10;
}

// OFF stores energy as "energy-kcal_100g" (kcal) or "energy_100g" (kJ).
// We always want kcal.
function extractKcal(nutriments) {
  if (nutriments["energy-kcal_100g"] != null) {
    return round1(nutriments["energy-kcal_100g"]);
  }
  if (nutriments["energy_100g"] != null) {
    return round1(nutriments["energy_100g"] / 4.184); // kJ → kcal
  }
  return 0;
}

/**
 * Search Open Food Facts for products matching `query`.
 *
 * @param {string} query  — e.g. "Amul Masti dahi" or "whey protein"
 * @returns {Promise<Array>} — array of:
 *   { productId, name, brand, per100g: { calories, proteinG, carbsG, fatG, fiberG } }
 */
export async function searchProducts(query) {
  const params = new URLSearchParams({
    search_terms: query.trim(),
    search_simple: "1",
    action: "process",
    json: "1",
    page_size: "8",
    fields: "product_name,brands,nutriments,code",
  });

  const response = await fetch(`${BASE_URL}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Open Food Facts responded with status ${response.status}`);
  }

  const data = await response.json();
  const products = data.products || [];

  return products
    .filter((p) => p.product_name && p.product_name.trim() !== "")
    .map((p) => {
      const n = p.nutriments || {};
      return {
        productId: p.code || `off-${Math.random().toString(36).slice(2)}`,
        name: p.product_name.trim(),
        // brands can be a comma-separated list; take the first one
        brand: p.brands ? p.brands.split(",")[0].trim() : "",
        per100g: {
          calories: extractKcal(n),
          proteinG: round1(n.proteins_100g),
          carbsG:   round1(n.carbohydrates_100g),
          fatG:     round1(n.fat_100g),
          fiberG:   round1(n.fiber_100g),
        },
      };
    });
}
