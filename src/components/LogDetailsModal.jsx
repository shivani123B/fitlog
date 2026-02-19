import Modal from "./Modal";

const MEAL_KEYS   = ["breakfast", "lunch", "dinner", "snacks"];
const MEAL_LABELS = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snacks: "Snacks" };

function round1(n) {
  return Math.round((Number(n) || 0) * 10) / 10;
}

// Handles both old string items and new FoodItem objects.
function getItemDisplay(item) {
  if (typeof item === "string") return { name: item, grams: null, macros: null };
  return {
    name:   item.selected ? item.selected.name : item.query,
    brand:  item.selected?.brand || null,
    grams:  item.grams > 0 ? item.grams : null,
    macros: item.selected && item.computed ? item.computed : null,
  };
}

// Sum macros across an array of items (handles both string and object items).
function sumItems(items) {
  const acc = { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 };
  items.forEach((item) => {
    if (typeof item === "string") return;
    const c = item.computed || {};
    acc.calories += c.calories || 0;
    acc.proteinG += c.proteinG || 0;
    acc.carbsG   += c.carbsG   || 0;
    acc.fatG     += c.fatG     || 0;
    acc.fiberG   += c.fiberG   || 0;
  });
  return {
    calories: round1(acc.calories),
    proteinG: round1(acc.proteinG),
    carbsG:   round1(acc.carbsG),
    fatG:     round1(acc.fatG),
    fiberG:   round1(acc.fiberG),
  };
}

function MacroBadge({ label, value }) {
  return (
    <div
      style={{
        background: "#f0f4ff",
        border: "1px solid #c9d6f5",
        borderRadius: 6,
        padding: "5px 10px",
        fontSize: 13,
      }}
    >
      <span style={{ color: "#666" }}>{label}: </span>
      <strong>{value}</strong>
    </div>
  );
}

// Shows the full details (metrics, meals with per-item macros, notes) for one daily log.
export default function LogDetailsModal({ log, onClose }) {
  if (!log) return null;

  const meals = log.meals || {};

  // Compute overall day totals from all meal items
  const allItems = MEAL_KEYS.flatMap((k) => meals[k]?.items || []);
  const dayTotals = sumItems(allItems);
  const hasDayMacros = dayTotals.calories > 0;

  return (
    <Modal isOpen={!!log} onClose={onClose} title={`Daily Log — ${log.date}`}>

      {/* ── Stored metrics summary ── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 18,
          paddingBottom: 14,
          borderBottom: "1px solid #eee",
        }}
      >
        {[
          ["Weight",   log.morningWeightKg != null ? `${log.morningWeightKg} kg` : null],
          ["Calories", log.calories != null ? `${log.calories} kcal` : null],
          ["Protein",  log.proteinG != null ? `${log.proteinG} g` : null],
          ["Carbs",    log.carbsG   != null ? `${log.carbsG} g`   : null],
          ["Fat",      log.fatG     != null ? `${log.fatG} g`     : null],
          ["Fiber",    log.fiberG   != null ? `${log.fiberG} g`   : null],
          ["Steps",    log.steps    != null ? log.steps.toLocaleString() : null],
        ]
          .filter(([, v]) => v != null)
          .map(([label, value]) => (
            <MacroBadge key={label} label={label} value={value} />
          ))}
      </div>

      {/* ── Meal-computed day totals (if available) ── */}
      {hasDayMacros && (
        <div
          style={{
            background: "#e8f5e9",
            border: "1px solid #a5d6a7",
            borderRadius: 6,
            padding: "8px 12px",
            fontSize: 13,
            marginBottom: 18,
          }}
        >
          <strong>Day totals from meals: </strong>
          {dayTotals.calories} kcal · P:{dayTotals.proteinG}g ·
          C:{dayTotals.carbsG}g · F:{dayTotals.fatG}g · Fiber:{dayTotals.fiberG}g
        </div>
      )}

      {/* ── Meals ── */}
      <h3 style={{ margin: "0 0 12px", fontSize: 15, color: "#333" }}>Meals</h3>

      {MEAL_KEYS.every((k) => !(meals[k]?.items?.length > 0 || meals[k]?.time)) && (
        <p style={{ color: "#aaa", fontSize: 14, margin: "0 0 16px" }}>
          No meal data recorded for this day.
        </p>
      )}

      {MEAL_KEYS.map((key) => {
        const meal  = meals[key] || { time: "", items: [] };
        const items = meal.items || [];
        if (items.length === 0 && !meal.time) return null;

        const mealTotals   = sumItems(items);
        const hasMealMacros = mealTotals.calories > 0;

        return (
          <div
            key={key}
            style={{ marginBottom: 18, paddingBottom: 14, borderBottom: "1px solid #f0f0f0" }}
          >
            {/* Meal header */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
              <strong style={{ fontSize: 14 }}>{MEAL_LABELS[key]}</strong>
              {meal.time && <span style={{ fontSize: 12, color: "#888" }}>{meal.time}</span>}
              {hasMealMacros && (
                <span style={{ fontSize: 12, color: "#1976d2", marginLeft: "auto" }}>
                  {mealTotals.calories} kcal
                </span>
              )}
            </div>

            {/* Item list */}
            {items.length === 0 ? (
              <p style={{ margin: 0, color: "#ccc", fontSize: 13 }}>No items.</p>
            ) : (
              <ul style={{ margin: "0 0 6px", paddingLeft: 20 }}>
                {items.map((item, i) => {
                  const d = getItemDisplay(item);
                  return (
                    <li key={item.id || i} style={{ fontSize: 14, marginBottom: 4 }}>
                      <span style={{ fontWeight: 500 }}>{d.name}</span>
                      {d.grams && (
                        <span style={{ color: "#888", marginLeft: 5 }}>{d.grams} g</span>
                      )}
                      {d.brand && (
                        <span style={{ color: "#bbb", fontSize: 12, marginLeft: 5 }}>
                          ({d.brand})
                        </span>
                      )}
                      {d.macros && (
                        <div style={{ fontSize: 11, color: "#666", marginTop: 1 }}>
                          {round1(d.macros.calories)} kcal · P:{round1(d.macros.proteinG)}g ·
                          C:{round1(d.macros.carbsG)}g · F:{round1(d.macros.fatG)}g ·
                          Fiber:{round1(d.macros.fiberG)}g
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Meal totals row */}
            {hasMealMacros && (
              <div style={{ fontSize: 12, color: "#444", paddingLeft: 4 }}>
                <strong>Meal total: </strong>
                {mealTotals.calories} kcal · P:{mealTotals.proteinG}g ·
                C:{mealTotals.carbsG}g · F:{mealTotals.fatG}g · Fiber:{mealTotals.fiberG}g
              </div>
            )}
          </div>
        );
      })}

      {/* ── Notes ── */}
      {log.notes && (
        <div style={{ marginTop: 8 }}>
          <strong style={{ fontSize: 14 }}>Notes</strong>
          <p
            style={{
              margin: "6px 0 0",
              fontSize: 14,
              color: "#444",
              whiteSpace: "pre-wrap",
              background: "#fafafa",
              border: "1px solid #eee",
              borderRadius: 6,
              padding: "8px 10px",
            }}
          >
            {log.notes}
          </p>
        </div>
      )}
    </Modal>
  );
}
