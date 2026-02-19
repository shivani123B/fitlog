import { useState } from "react";
import FoodSearchRow from "./FoodSearchRow";

function round1(n) {
  return Math.round((Number(n) || 0) * 10) / 10;
}

// Sum computed macros across all items in a meal.
function sumMealMacros(items) {
  return items.reduce(
    (acc, item) => {
      const c = item.computed || {};
      return {
        calories: acc.calories + (c.calories || 0),
        proteinG: acc.proteinG + (c.proteinG || 0),
        carbsG:   acc.carbsG   + (c.carbsG   || 0),
        fatG:     acc.fatG     + (c.fatG     || 0),
        fiberG:   acc.fiberG   + (c.fiberG   || 0),
      };
    },
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 }
  );
}

// Reusable collapsible meal section (Breakfast / Lunch / Dinner / Snacks).
//
// Props:
//   label    — display name of the meal
//   meal     — { time: string, items: FoodItem[] }
//   onChange — function(updatedMeal) — called on every change
//
// FoodItem shape (new):
//   { id, query, grams, selected: { ... } | null, computed: { ... } }
// (Backward-compat: old string items are normalized by LogForm before reaching here.)
export default function MealSection({ label, meal, onChange }) {
  const [open, setOpen] = useState(false);

  const items  = meal.items || [];
  const totals = sumMealMacros(items);
  const hasCalories = totals.calories > 0;

  // Build the subtitle shown while collapsed
  const subtitle = [
    items.length > 0 ? `${items.length} item${items.length !== 1 ? "s" : ""}` : "",
    hasCalories ? `${round1(totals.calories)} kcal` : "",
    meal.time || "",
  ]
    .filter(Boolean)
    .join(" · ");

  function handleAddItem(newItem) {
    onChange({ ...meal, items: [...items, newItem] });
  }

  function handleRemoveItem(id) {
    onChange({ ...meal, items: items.filter((item) => item.id !== id) });
  }

  function handleTimeChange(e) {
    onChange({ ...meal, time: e.target.value });
  }

  return (
    <div
      style={{
        border: "1px solid #e0e0e0",
        borderRadius: 6,
        overflow: "hidden",
        marginBottom: 8,
      }}
    >
      {/* ── Collapsible header ── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "9px 12px",
          background: open ? "#e8f5e9" : "#f5f5f5",
          border: "none",
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 500,
          textAlign: "left",
        }}
      >
        <span>
          {label}
          {subtitle && (
            <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 400, color: "#666" }}>
              ({subtitle})
            </span>
          )}
        </span>
        <span style={{ fontSize: 11, color: "#888" }}>{open ? "▲ collapse" : "▼ expand"}</span>
      </button>

      {/* ── Expanded body ── */}
      {open && (
        <div style={{ padding: 12, background: "white" }}>
          {/* Time input */}
          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
              marginBottom: 12,
              fontSize: 13,
              color: "#555",
            }}
          >
            Time (optional)
            <input
              type="time"
              value={meal.time}
              onChange={handleTimeChange}
              style={{
                padding: "5px 8px",
                border: "1px solid #ccc",
                borderRadius: 4,
                fontSize: 14,
                width: 130,
              }}
            />
          </label>

          {/* Food search row */}
          <FoodSearchRow onAdd={handleAddItem} />

          {/* Items list */}
          {items.length === 0 && (
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#bbb", fontStyle: "italic" }}>
              No items yet. Search for a food above.
            </p>
          )}

          {items.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    background: "#f9fafb",
                    border: "1px solid #e8e8e8",
                    borderRadius: 6,
                    padding: "8px 10px",
                    marginBottom: 6,
                    gap: 8,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Name + grams */}
                    <div style={{ fontSize: 13, fontWeight: 500 }}>
                      {item.selected ? item.selected.name : item.query}
                      {item.grams > 0 && (
                        <span style={{ fontWeight: 400, color: "#777", marginLeft: 6 }}>
                          {item.grams} g
                        </span>
                      )}
                    </div>
                    {/* Brand */}
                    {item.selected?.brand && (
                      <div style={{ fontSize: 11, color: "#aaa" }}>{item.selected.brand}</div>
                    )}
                    {/* Computed macros */}
                    {item.selected ? (
                      <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
                        {round1(item.computed.calories)} kcal · P:{round1(item.computed.proteinG)}g ·
                        C:{round1(item.computed.carbsG)}g · F:{round1(item.computed.fatG)}g ·
                        Fiber:{round1(item.computed.fiberG)}g
                      </div>
                    ) : (
                      <div style={{ fontSize: 11, color: "#ccc", fontStyle: "italic" }}>
                        no nutrition data linked
                      </div>
                    )}
                  </div>

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    title="Remove item"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#e53935",
                      fontSize: 20,
                      lineHeight: 1,
                      padding: 0,
                      flexShrink: 0,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}

              {/* Meal totals */}
              {hasCalories && (
                <div
                  style={{
                    background: "#f0f4ff",
                    border: "1px solid #c9d6f5",
                    borderRadius: 6,
                    padding: "6px 10px",
                    fontSize: 12,
                    color: "#333",
                    marginTop: 4,
                  }}
                >
                  <strong>Meal total: </strong>
                  {round1(totals.calories)} kcal · P:{round1(totals.proteinG)}g ·
                  C:{round1(totals.carbsG)}g · F:{round1(totals.fatG)}g ·
                  Fiber:{round1(totals.fiberG)}g
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
