import { useState } from "react";
import MealItemEditor from "./MealItemEditor";

function round1(n) {
  return Math.round((Number(n) || 0) * 10) / 10;
}

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

// Collapsible meal section (Breakfast / Lunch / Dinner / Snacks).
//
// Props:
//   label    — "Breakfast" | "Lunch" | "Dinner" | "Snacks"
//   meal     — { time: string, items: FoodItem[] }
//   onChange — function(updatedMeal)
export default function MealSection({ label, meal, onChange }) {
  const [open,          setOpen]          = useState(false);
  // id of the item currently being edited, or null
  const [editingItemId, setEditingItemId] = useState(null);

  const items      = meal.items || [];
  const totals     = sumMealMacros(items);
  const hasCalories = totals.calories > 0;

  // Find the item object being edited (null if none)
  const editingItem = editingItemId
    ? items.find((i) => i.id === editingItemId) ?? null
    : null;

  // Collapsed-header subtitle
  const subtitle = [
    items.length > 0 ? `${items.length} item${items.length !== 1 ? "s" : ""}` : "",
    hasCalories ? `${round1(totals.calories)} kcal` : "",
    meal.time || "",
  ]
    .filter(Boolean)
    .join(" · ");

  // ── Callbacks ──

  function handleAddOrUpdate(newItem) {
    if (editingItemId) {
      // Replace the item in-place by id
      onChange({ ...meal, items: items.map((i) => i.id === editingItemId ? newItem : i) });
      setEditingItemId(null);
    } else {
      onChange({ ...meal, items: [...items, newItem] });
    }
  }

  function handleEdit(id) {
    setEditingItemId(id);
    setOpen(true); // ensure section is expanded
  }

  function handleDelete(id) {
    if (editingItemId === id) setEditingItemId(null);
    onChange({ ...meal, items: items.filter((i) => i.id !== id) });
  }

  function handleCancelEdit() {
    setEditingItemId(null);
  }

  function handleTimeChange(e) {
    onChange({ ...meal, time: e.target.value });
  }

  return (
    <div
      style={{
        border: "1px solid var(--border)",
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
          background: open ? "var(--accent-light)" : "var(--bg-secondary)",
          border: "none",
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 500,
          textAlign: "left",
          color: "var(--text-primary)",
        }}
      >
        <span>
          {label}
          {subtitle && (
            <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 400, color: "var(--text-muted)" }}>
              ({subtitle})
            </span>
          )}
        </span>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
          {open ? "▲ collapse" : "▼ expand"}
        </span>
      </button>

      {/* ── Expanded body ── */}
      {open && (
        <div style={{ padding: 12, background: "var(--bg-card)" }}>
          {/* Time input */}
          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
              marginBottom: 12,
              fontSize: 13,
              color: "var(--text-secondary)",
            }}
          >
            Time (optional)
            <input
              type="time"
              value={meal.time}
              onChange={handleTimeChange}
              style={{
                padding: "5px 8px",
                border: "1px solid var(--border)",
                borderRadius: 4,
                fontSize: 14,
                width: 130,
              }}
            />
          </label>

          {/* Item editor — always visible; pre-filled when editingItem is set */}
          <MealItemEditor
            onAdd={handleAddOrUpdate}
            initialItem={editingItem}
            onCancelEdit={handleCancelEdit}
          />

          {/* Empty state */}
          {items.length === 0 && (
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
              No items yet. Search or enter a food above.
            </p>
          )}

          {/* ── Items list ── */}
          {items.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {items.map((item) => {
                const isBeingEdited = item.id === editingItemId;
                const hasMacros = item.computed &&
                  (item.computed.calories > 0 || item.computed.proteinG > 0 ||
                   item.computed.carbsG > 0 || item.computed.fatG > 0);

                return (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      background: isBeingEdited ? "var(--accent-light)" : "var(--bg-secondary)",
                      border: `1px solid ${isBeingEdited ? "var(--accent)" : "var(--border)"}`,
                      borderRadius: 6,
                      padding: "8px 10px",
                      marginBottom: 6,
                      gap: 8,
                    }}
                  >
                    {/* Item info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
                        {item.name}
                        {item.grams > 0 && (
                          <span style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: 6 }}>
                            {item.grams} g
                          </span>
                        )}
                        {/* Badge: generic / off / manual */}
                        {item.mode === "generic" ? (
                          <span style={{ fontSize: 10, background: "#e8f5e9", color: "#2e7d32", borderRadius: 10, padding: "1px 6px", marginLeft: 6 }}>
                            Generic
                          </span>
                        ) : item.mode === "off" ? (
                          <span style={{ fontSize: 10, background: "#e3f2fd", color: "#1565c0", borderRadius: 10, padding: "1px 6px", marginLeft: 6 }}>
                            OFF
                          </span>
                        ) : (
                          <span style={{ fontSize: 10, background: "#ede7f6", color: "#6a1b9a", borderRadius: 10, padding: "1px 6px", marginLeft: 6 }}>
                            manual
                          </span>
                        )}
                      </div>

                      {/* Brand (OFF items) */}
                      {item.selected?.brand && (
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{item.selected.brand}</div>
                      )}

                      {/* Computed macros */}
                      {hasMacros ? (
                        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
                          {round1(item.computed.calories)} kcal ·
                          P:{round1(item.computed.proteinG)}g ·
                          C:{round1(item.computed.carbsG)}g ·
                          F:{round1(item.computed.fatG)}g ·
                          Fiber:{round1(item.computed.fiberG)}g
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>
                          no nutrition data
                        </div>
                      )}
                    </div>

                    {/* Edit / Delete buttons */}
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      {!isBeingEdited && (
                        <button
                          type="button"
                          onClick={() => handleEdit(item.id)}
                          className="btn-secondary"
                          style={{ padding: "3px 9px", fontSize: 11 }}
                        >
                          Edit
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="btn-danger"
                        style={{ padding: "3px 9px", fontSize: 11 }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Meal totals */}
              {hasCalories && (
                <div
                  style={{
                    background: "var(--accent-light)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    padding: "6px 10px",
                    fontSize: 12,
                    color: "var(--text-primary)",
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
