import { useState, useEffect } from "react";
import MealSection from "./MealSection";

// ── Helpers ───────────────────────────────────────────────────────────────────

function round1(n) {
  return Math.round((Number(n) || 0) * 10) / 10;
}

const ZERO_COMPUTED = { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 };

// Converts any item shape into the current FoodItem format.
// Handles three cases:
//   1. Old string  (pre-meal-tracking era)
//   2. Old object  (has `query` field, no `mode` — from previous meal feature iteration)
//   3. Current object (has `mode` field) — ensure computed exists
function normalizeItem(item) {
  if (typeof item === "string") {
    return {
      id:       Math.random().toString(36).slice(2),
      mode:     "manual",
      name:     item,
      grams:    0,
      selected: null,
      manual:   null,
      computed: ZERO_COMPUTED,
    };
  }

  // Old object format (has `query` but no `mode`)
  if (item.mode === undefined && item.query !== undefined) {
    return {
      id:       item.id || Math.random().toString(36).slice(2),
      mode:     item.selected ? "off" : "manual",
      name:     item.selected ? (item.selected.name || item.query) : item.query,
      grams:    item.grams || 0,
      selected: item.selected || null,
      manual:   null,
      computed: item.computed || ZERO_COMPUTED,
    };
  }

  // Current format — just ensure computed exists
  return {
    ...item,
    computed: item.computed || ZERO_COMPUTED,
  };
}

const DEFAULT_MEALS = {
  breakfast: { time: "", items: [] },
  lunch:     { time: "", items: [] },
  dinner:    { time: "", items: [] },
  snacks:    { time: "", items: [] },
};

function normalizeMeals(meals) {
  if (!meals) return DEFAULT_MEALS;
  return {
    breakfast: { time: meals.breakfast?.time || "", items: (meals.breakfast?.items || []).map(normalizeItem) },
    lunch:     { time: meals.lunch?.time     || "", items: (meals.lunch?.items     || []).map(normalizeItem) },
    dinner:    { time: meals.dinner?.time    || "", items: (meals.dinner?.items    || []).map(normalizeItem) },
    snacks:    { time: meals.snacks?.time    || "", items: (meals.snacks?.items    || []).map(normalizeItem) },
  };
}

// Sum computed macros from all items across all four meal sections.
function computeDayTotals(meals) {
  const keys = ["breakfast", "lunch", "dinner", "snacks"];
  const acc = { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 };
  keys.forEach((key) => {
    (meals[key]?.items || []).forEach((item) => {
      const c = item.computed || {};
      acc.calories += c.calories || 0;
      acc.proteinG += c.proteinG || 0;
      acc.carbsG   += c.carbsG   || 0;
      acc.fatG     += c.fatG     || 0;
      acc.fiberG   += c.fiberG   || 0;
    });
  });
  return {
    calories: round1(acc.calories),
    proteinG: round1(acc.proteinG),
    carbsG:   round1(acc.carbsG),
    fatG:     round1(acc.fatG),
    fiberG:   round1(acc.fiberG),
  };
}

// ── Constants ─────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  date: "",
  morningWeightKg: "",
  calories: "",
  proteinG: "",
  carbsG: "",
  fatG: "",
  fiberG: "",
  steps: "",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function LogForm({ editingLog, onSave, onCancel }) {
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [meals,    setMeals]    = useState(DEFAULT_MEALS);
  const [notes,    setNotes]    = useState("");
  // When true, macro fields are read-only and derived from meal item totals.
  const [autoFill, setAutoFill] = useState(true);

  // Populate or reset all state when editingLog changes.
  useEffect(() => {
    if (editingLog) {
      setForm({
        date:            editingLog.date            || "",
        morningWeightKg: editingLog.morningWeightKg ?? "",
        calories:        editingLog.calories        ?? "",
        proteinG:        editingLog.proteinG        ?? "",
        carbsG:          editingLog.carbsG          ?? "",
        fatG:            editingLog.fatG            ?? "",
        fiberG:          editingLog.fiberG          ?? "",
        steps:           editingLog.steps           ?? "",
      });
      setMeals(normalizeMeals(editingLog.meals));
      setNotes(editingLog.notes || "");
      setAutoFill(true); // always default ON when opening a log
    } else {
      setForm(EMPTY_FORM);
      setMeals(DEFAULT_MEALS);
      setNotes("");
      setAutoFill(true);
    }
  }, [editingLog]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleMealChange(mealKey, updatedMeal) {
    setMeals({ ...meals, [mealKey]: updatedMeal });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.date) return alert("Please select a date.");

    const dayTotals = computeDayTotals(meals);

    // When autoFill is ON, use computed totals for macros.
    // When OFF, use whatever the user typed (null if blank).
    const parsed = {
      date:            form.date,
      morningWeightKg: form.morningWeightKg !== "" ? Number(form.morningWeightKg) : null,
      calories: autoFill ? dayTotals.calories  : (form.calories !== "" ? Number(form.calories) : null),
      proteinG: autoFill ? dayTotals.proteinG  : (form.proteinG !== "" ? Number(form.proteinG) : null),
      carbsG:   autoFill ? dayTotals.carbsG    : (form.carbsG   !== "" ? Number(form.carbsG)   : null),
      fatG:     autoFill ? dayTotals.fatG      : (form.fatG     !== "" ? Number(form.fatG)     : null),
      fiberG:   autoFill ? dayTotals.fiberG    : (form.fiberG   !== "" ? Number(form.fiberG)   : null),
      steps:           form.steps !== "" ? Number(form.steps) : null,
      meals,
      notes: notes.trim(),
    };

    onSave(parsed);
    setForm(EMPTY_FORM);
    setMeals(DEFAULT_MEALS);
    setNotes("");
    setAutoFill(true);
  }

  const isEditing = !!editingLog;
  const dayTotals = computeDayTotals(meals);
  const hasMealMacros = dayTotals.calories > 0;

  const inputStyle = {
    padding: "6px 8px",
    width: 110,
    boxSizing: "border-box",
    border: "1px solid var(--border)",
    borderRadius: 4,
    fontSize: 14,
  };

  const labelStyle = {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    fontSize: 13,
    color: "var(--text-secondary)",
  };

  // Macro input values: computed when autoFill ON, user-typed when OFF.
  const macroVal = (key) =>
    autoFill ? (hasMealMacros ? String(dayTotals[key] ?? "") : "") : form[key];

  return (
    <form onSubmit={handleSubmit}>
      <h2 style={{ margin: "0 0 14px", fontSize: 18, color: "var(--text-primary)" }}>
        {isEditing ? `Editing log for ${editingLog.date}` : "Add Log"}
      </h2>

      {/* ── Date + Weight + Steps row ── */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 16 }}>
        <label style={labelStyle}>
          Date *
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            required
            disabled={isEditing}
            style={{
              ...inputStyle,
              background: isEditing ? "var(--bg-secondary)" : "var(--bg-input)",
              opacity: isEditing ? 0.7 : 1,
            }}
          />
        </label>

        <label style={labelStyle}>
          Weight (kg)
          <input
            type="number"
            name="morningWeightKg"
            value={form.morningWeightKg}
            onChange={handleChange}
            step="0.1"
            min="0"
            placeholder="e.g. 70.5"
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          Steps
          <input
            type="number"
            name="steps"
            value={form.steps}
            onChange={handleChange}
            min="0"
            placeholder="steps"
            style={inputStyle}
          />
        </label>
      </div>

      {/* ── Macro fields + auto-fill toggle ── */}
      <div
        style={{
          background: autoFill ? "var(--accent-light)" : "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          padding: "12px 14px",
          marginBottom: 20,
        }}
      >
        {/* Toggle row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer", color: "var(--text-primary)" }}>
            <input
              type="checkbox"
              checked={autoFill}
              onChange={(e) => setAutoFill(e.target.checked)}
              style={{ width: 15, height: 15 }}
            />
            <strong>Auto-fill macros from meals</strong>
          </label>
          {autoFill && (
            <span style={{ fontSize: 12, color: "var(--accent)" }}>
              {hasMealMacros
                ? `Day total: ${dayTotals.calories} kcal · P:${dayTotals.proteinG}g · C:${dayTotals.carbsG}g · F:${dayTotals.fatG}g · Fiber:${dayTotals.fiberG}g`
                : "Add foods in Meals to compute totals automatically"}
            </span>
          )}
        </div>

        {/* Macro inputs */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          {[
            { label: "Calories", name: "calories", placeholder: "kcal" },
            { label: "Protein (g)", name: "proteinG", placeholder: "g" },
            { label: "Carbs (g)", name: "carbsG", placeholder: "g" },
            { label: "Fat (g)", name: "fatG", placeholder: "g" },
            { label: "Fiber (g)", name: "fiberG", placeholder: "g" },
          ].map(({ label, name, placeholder }) => (
            <label key={name} style={labelStyle}>
              {label}
              <input
                type="number"
                name={name}
                value={macroVal(name)}
                onChange={autoFill ? undefined : handleChange}
                readOnly={autoFill}
                min="0"
                placeholder={autoFill ? "—" : placeholder}
                style={{
                  ...inputStyle,
                  background: autoFill ? "var(--accent-light)" : "var(--bg-input)",
                  color: autoFill ? "var(--accent)" : "var(--text-primary)",
                  cursor: autoFill ? "default" : "text",
                }}
              />
            </label>
          ))}
        </div>
      </div>

      {/* ── Meals ── */}
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ margin: "0 0 10px", fontSize: 15, color: "var(--text-secondary)", fontWeight: 600 }}>Meals</h3>
        {["breakfast", "lunch", "dinner", "snacks"].map((key) => (
          <MealSection
            key={key}
            label={key.charAt(0).toUpperCase() + key.slice(1)}
            meal={meals[key]}
            onChange={(updated) => handleMealChange(key, updated)}
          />
        ))}
      </div>

      {/* ── Notes ── */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ ...labelStyle, fontSize: 14 }}>
          Notes (optional)
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything else about today…"
            rows={2}
            style={{
              padding: "7px 9px",
              border: "1px solid var(--border)",
              borderRadius: 4,
              fontSize: 14,
              resize: "vertical",
              fontFamily: "inherit",
              width: "100%",
              boxSizing: "border-box",
            }}
          />
        </label>
      </div>

      {/* ── Submit / Cancel ── */}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" className="btn-primary">
          {isEditing ? "Update" : "Add"}
        </button>

        {isEditing && (
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
