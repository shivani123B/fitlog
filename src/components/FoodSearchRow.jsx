import { useState } from "react";
import { searchProducts } from "../utils/openFoodFacts";

// Multiply per-100g values by (grams / 100).
function computeMacros(per100g, grams) {
  const f = Number(grams) / 100;
  const r = (n) => Math.round((Number(n) || 0) * f * 10) / 10;
  return {
    calories: r(per100g.calories),
    proteinG: r(per100g.proteinG),
    carbsG:   r(per100g.carbsG),
    fatG:     r(per100g.fatG),
    fiberG:   r(per100g.fiberG),
  };
}

// Inline search-select row used inside MealSection.
// Calls onAdd(foodItem) when the user picks a product.
//
// foodItem shape:
//   { id, query, grams, selected: { source, productId, name, brand, per100g }, computed }
export default function FoodSearchRow({ onAdd }) {
  const [query,   setQuery]   = useState("");
  const [grams,   setGrams]   = useState("");
  const [results, setResults] = useState([]);
  // status: "idle" | "loading" | "error" | "done"
  const [status,  setStatus]  = useState("idle");

  async function handleSearch() {
    const q = query.trim();
    if (!q) return;
    setStatus("loading");
    setResults([]);
    try {
      const data = await searchProducts(q);
      setResults(data);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  // Prevent the parent <form> from submitting when Enter is pressed in these inputs.
  function onQueryKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  }
  function onGramsKeyDown(e) {
    if (e.key === "Enter") e.preventDefault();
  }

  function handleSelect(product) {
    const g = Number(grams);
    if (!g || g <= 0) {
      alert("Enter the quantity in grams before selecting a product.");
      return;
    }

    const item = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      query,
      grams: g,
      selected: {
        source: "openfoodfacts",
        productId: product.productId,
        name: product.name,
        brand: product.brand,
        per100g: product.per100g,
      },
      computed: computeMacros(product.per100g, g),
    };

    onAdd(item);
    // reset for next entry
    setQuery("");
    setGrams("");
    setResults([]);
    setStatus("idle");
  }

  const inp = {
    padding: "6px 9px",
    border: "1px solid #ccc",
    borderRadius: 4,
    fontSize: 13,
  };

  return (
    <div style={{ marginBottom: 10 }}>
      {/* Search row */}
      <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onQueryKeyDown}
          placeholder="Search food (e.g. Amul Masti dahi)"
          style={{ ...inp, flex: "1 1 180px", minWidth: 0 }}
        />
        <input
          type="number"
          value={grams}
          onChange={(e) => setGrams(e.target.value)}
          onKeyDown={onGramsKeyDown}
          placeholder="Grams"
          min="1"
          style={{ ...inp, width: 80 }}
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={status === "loading" || query.trim() === ""}
          style={{
            padding: "6px 14px",
            background: status === "loading" ? "#90a4ae" : "#1976d2",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: status === "loading" ? "default" : "pointer",
            fontSize: 13,
            whiteSpace: "nowrap",
          }}
        >
          {status === "loading" ? "Searching…" : "Search"}
        </button>
      </div>

      {/* Error */}
      {status === "error" && (
        <p style={{ margin: "0 0 6px", fontSize: 12, color: "#e53935" }}>
          Search failed — check your internet connection and try again.
        </p>
      )}

      {/* No results */}
      {status === "done" && results.length === 0 && (
        <p style={{ margin: "0 0 6px", fontSize: 12, color: "#888" }}>
          No results found. Try a different search term.
        </p>
      )}

      {/* Results list */}
      {results.length > 0 && (
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 6,
            overflow: "hidden",
            marginBottom: 4,
          }}
        >
          {results.map((product, i) => (
            <div
              key={product.productId}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 10px",
                borderBottom: i < results.length - 1 ? "1px solid #f0f0f0" : "none",
                gap: 8,
                background: i % 2 === 0 ? "white" : "#fafafa",
              }}
            >
              {/* Product info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {product.name}
                </div>
                {product.brand && (
                  <div style={{ fontSize: 11, color: "#888" }}>{product.brand}</div>
                )}
                <div style={{ fontSize: 11, color: "#999", marginTop: 1 }}>
                  per 100g — {product.per100g.calories} kcal · P:{product.per100g.proteinG}g ·
                  C:{product.per100g.carbsG}g · F:{product.per100g.fatG}g · Fiber:{product.per100g.fiberG}g
                </div>
              </div>

              {/* Select button */}
              <button
                type="button"
                onClick={() => handleSelect(product)}
                style={{
                  padding: "5px 12px",
                  fontSize: 12,
                  background: "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                Select
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
