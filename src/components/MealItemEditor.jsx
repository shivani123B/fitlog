import { useState, useEffect, useRef } from "react";
import { useAutocomplete }   from "../hooks/useAutocomplete";
import { searchGenericFoods } from "../utils/genericNutrition";
import { searchProducts }     from "../utils/openFoodFacts";

// ── Macro field definitions ───────────────────────────────────────────────────

const MACRO_FIELDS = [
  { key: "calories", label: "Calories (kcal)" },
  { key: "proteinG", label: "Protein (g)" },
  { key: "carbsG",   label: "Carbs (g)" },
  { key: "fatG",     label: "Fat (g)" },
  { key: "fiberG",   label: "Fiber (g)" },
];

const ZERO_MACROS = { calories: "", proteinG: "", carbsG: "", fatG: "", fiberG: "" };

// ── Helpers ───────────────────────────────────────────────────────────────────

function round1(n) {
  return Math.round((Number(n) || 0) * 10) / 10;
}

function computeFromPer100g(values, grams) {
  const f = Number(grams) / 100;
  return {
    calories: round1((Number(values.calories) || 0) * f),
    proteinG: round1((Number(values.proteinG) || 0) * f),
    carbsG:   round1((Number(values.carbsG)   || 0) * f),
    fatG:     round1((Number(values.fatG)     || 0) * f),
    fiberG:   round1((Number(values.fiberG)   || 0) * f),
  };
}

function computeAbsolute(values) {
  return {
    calories: round1(Number(values.calories) || 0),
    proteinG: round1(Number(values.proteinG) || 0),
    carbsG:   round1(Number(values.carbsG)   || 0),
    fatG:     round1(Number(values.fatG)     || 0),
    fiberG:   round1(Number(values.fiberG)   || 0),
  };
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// ── Component ─────────────────────────────────────────────────────────────────
//
// Three modes:
//   "generic" [default] — Tier 1: USDA whole-food search with typeahead
//   "off"               — Tier 2: Open Food Facts packaged-food search with typeahead
//   "manual"            — Tier 3: direct macro entry
//
// Search modes flow:
//   1. User types → autocomplete dropdown appears (debounced 300ms)
//   2. User selects a result → input shows food name, dropdown closes,
//      live macro preview appears below (updates as grams change)
//   3. User clicks "Add item" to confirm
//   Editing query after selection clears the selection and re-activates search.
//
// Props:
//   onAdd(item)      — called when item is finalized
//   initialItem      — if provided, editor is pre-filled (edit mode)
//   onCancelEdit     — called on Cancel in edit mode

export default function MealItemEditor({ onAdd, initialItem = null, onCancelEdit }) {
  const isEditing = !!initialItem;

  // Unique prefix for manual-mode radio group (prevents cross-instance collision)
  const [radioName] = useState(() => `basis-${makeId()}`);

  // ── Shared state ──
  const [mode,  setMode]  = useState("generic"); // "generic" | "off" | "manual"
  const [grams, setGrams] = useState("");

  // ── Search-mode state ──
  // `query` drives both the input display and the autocomplete.
  // `selectedFood` is set on dropdown selection; cleared when user edits query.
  const [query,        setQuery]        = useState("");
  const [selectedFood, setSelectedFood] = useState(null);

  // ── Manual-mode state ──
  const [manualName,   setManualName]   = useState("");
  const [basis,        setBasis]        = useState("per100g"); // "per100g" | "absolute"
  const [manualValues, setManualValues] = useState(ZERO_MACROS);

  // ── DOM refs ──
  const containerRef = useRef(null); // wraps search input + dropdown for click-outside
  const dropdownRef  = useRef(null); // direct ref to dropdown list for scroll-into-view

  // ── Autocomplete hook ──
  // Pass "" when food is already selected so the hook stays idle (dropdown hidden).
  const autocompleteQuery = selectedFood ? "" : query;
  const fetcher = mode === "generic" ? searchGenericFoods
                : mode === "off"     ? searchProducts
                : null;

  const {
    results, loading, error,
    open, setOpen,
    highlightedIndex, setHighlightedIndex,
  } = useAutocomplete({ query: autocompleteQuery, mode, fetcher });

  // ── Close dropdown on outside click ──
  useEffect(() => {
    function handleMouseDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [setOpen]);

  // ── Scroll highlighted result into view ──
  useEffect(() => {
    if (!dropdownRef.current || highlightedIndex < 0) return;
    const el = dropdownRef.current.children[highlightedIndex];
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

  // ── Reset all state ──
  function reset() {
    setMode("generic");
    setGrams("");
    setQuery("");
    setSelectedFood(null);
    setManualName("");
    setBasis("per100g");
    setManualValues(ZERO_MACROS);
  }

  // ── Switch mode: keep grams, clear search state ──
  function switchMode(m) {
    setMode(m);
    setQuery("");
    setSelectedFood(null);
  }

  // ── Pre-fill from initialItem (edit mode) ──
  useEffect(() => {
    if (!initialItem) { reset(); return; }

    setGrams(String(initialItem.grams || ""));

    if (initialItem.mode === "generic" && initialItem.selected) {
      setMode("generic");
      setQuery(initialItem.name || "");
      setSelectedFood({
        foodId:  initialItem.selected.foodId,
        name:    initialItem.name,
        brand:   null,
        per100g: initialItem.selected.per100g,
      });
    } else if (initialItem.mode === "off" && initialItem.selected) {
      setMode("off");
      setQuery(initialItem.name || "");
      setSelectedFood({
        productId: initialItem.selected.productId,
        name:      initialItem.name,
        brand:     initialItem.selected.brand || "",
        per100g:   initialItem.selected.per100g,
      });
    } else {
      // manual, or legacy items normalized to manual
      setMode("manual");
      setManualName(initialItem.name || "");
      const bas  = initialItem.manual?.basis || "per100g";
      const vals = bas === "per100g" ? initialItem.manual?.per100g : initialItem.manual?.absolute;
      setBasis(bas);
      setManualValues(vals ? {
        calories: String(vals.calories ?? ""),
        proteinG: String(vals.proteinG ?? ""),
        carbsG:   String(vals.carbsG   ?? ""),
        fatG:     String(vals.fatG     ?? ""),
        fiberG:   String(vals.fiberG   ?? ""),
      } : ZERO_MACROS);
    }
  }, [initialItem]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Query change: clear selection so autocomplete re-activates ──
  function handleQueryChange(e) {
    setQuery(e.target.value);
    if (selectedFood) setSelectedFood(null);
  }

  // ── Keyboard navigation on the search input ──
  function handleKeyDown(e) {
    if (e.key === "ArrowDown") {
      if (!open) return;
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      if (!open) return;
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && highlightedIndex >= 0 && results[highlightedIndex]) {
        handleSelectResult(results[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      if (open) { e.preventDefault(); setOpen(false); }
    }
  }

  // ── Select a result from dropdown ──
  function handleSelectResult(item) {
    setQuery(item.name);
    setSelectedFood(item);
    setOpen(false);
  }

  // ── Build and submit item (search modes) ──
  function handleAddSearchItem() {
    if (!selectedFood) {
      alert("Select a food from the suggestions first.");
      return;
    }
    const g = Number(grams);
    if (!g || g <= 0) {
      alert("Enter the quantity in grams.\n(e.g., oil: ~5g per tsp · ghee: ~14g per tbsp)");
      return;
    }

    const item = {
      id:       initialItem?.id || makeId(),
      mode,
      name:     selectedFood.name,
      grams:    g,
      selected: mode === "generic"
        ? { source: "generic",        foodId:    selectedFood.foodId,    brand: null,                 per100g: selectedFood.per100g }
        : { source: "openfoodfacts",  productId: selectedFood.productId, brand: selectedFood.brand,   per100g: selectedFood.per100g },
      manual:   null,
      computed: computeFromPer100g(selectedFood.per100g, g),
    };
    onAdd(item);
    if (!isEditing) reset();
  }

  // ── Manual add ──
  function handleManualAdd() {
    const nm = manualName.trim();
    if (!nm)          { alert("Enter a food name.");              return; }
    const g = Number(grams);
    if (!g || g <= 0) { alert("Enter the quantity in grams.");   return; }

    const vals = {
      calories: Number(manualValues.calories) || 0,
      proteinG: Number(manualValues.proteinG) || 0,
      carbsG:   Number(manualValues.carbsG)   || 0,
      fatG:     Number(manualValues.fatG)     || 0,
      fiberG:   Number(manualValues.fiberG)   || 0,
    };
    const computed = basis === "per100g"
      ? computeFromPer100g(vals, g)
      : computeAbsolute(vals);

    const item = {
      id:       initialItem?.id || makeId(),
      mode:     "manual",
      name:     nm,
      grams:    g,
      selected: null,
      manual: {
        basis,
        per100g:  basis === "per100g"  ? vals : null,
        absolute: basis === "absolute" ? vals : null,
      },
      computed,
    };
    onAdd(item);
    if (!isEditing) reset();
  }

  // ── Derived values ──
  const g = Number(grams);

  // Live macro preview when a food is selected (search modes)
  const searchPreview = selectedFood && g > 0
    ? computeFromPer100g(selectedFood.per100g, g)
    : null;

  // Live preview for manual mode
  const manualPreview = mode === "manual" && g > 0
    ? (basis === "per100g" ? computeFromPer100g(manualValues, g) : computeAbsolute(manualValues))
    : null;
  const previewHasData = manualPreview && Object.values(manualPreview).some((v) => v > 0);

  // ── Style helpers ──
  const inp = {
    padding: "6px 9px",
    border: "1px solid var(--border)",
    borderRadius: 4,
    fontSize: 13,
  };

  function tabBtn(active, color) {
    return {
      padding: "5px 13px", fontSize: 12, borderRadius: 4,
      border: `1px solid ${color}`, cursor: "pointer",
      background: active ? color : "var(--bg-card)",
      color: active ? "white" : color,
      fontWeight: active ? 600 : 400,
    };
  }

  const isSearchMode = mode === "generic" || mode === "off";
  const modeColor = mode === "generic" ? "#2e7d32" : mode === "off" ? "#1565c0" : "#6a1b9a";

  // ── Render ──

  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        borderRadius: 6,
        padding: 12,
        marginBottom: 12,
      }}
    >
      {/* ── Title ── */}
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 10 }}>
        {isEditing ? `Editing: ${initialItem.name}` : "Add item"}
      </div>

      {/* ── Mode tabs ── */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        <button type="button" onClick={() => switchMode("generic")} style={tabBtn(mode === "generic", "#2e7d32")}>
          Auto (Generic)
        </button>
        <button type="button" onClick={() => switchMode("off")} style={tabBtn(mode === "off", "#1565c0")}>
          Packaged (OFF)
        </button>
        <button type="button" onClick={() => switchMode("manual")} style={tabBtn(mode === "manual", "#6a1b9a")}>
          Manual
        </button>
      </div>

      {/* ══ Search modes (Generic + OFF) ══ */}
      {isSearchMode && (
        <div ref={containerRef}>
          <p style={{ margin: "0 0 6px", fontSize: 11, color: "var(--text-secondary)" }}>
            {mode === "generic"
              ? "Whole foods, fruits, vegetables, grains, oils, spices — USDA database."
              : "Packaged / branded products — Open Food Facts database."}
          </p>

          {/* Input row */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "flex-start" }}>

            {/* Query input + dropdown (relative wrapper) */}
            <div style={{ position: "relative", flex: "1 1 180px", minWidth: 0 }}>
              <input
                type="text"
                value={query}
                onChange={handleQueryChange}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  // Re-open if there are cached results and nothing is selected yet
                  if (!selectedFood && results.length > 0) setOpen(true);
                }}
                placeholder={
                  mode === "generic"
                    ? "e.g. apple, carrot, olive oil, ghee, turmeric…"
                    : "e.g. Amul Masti dahi, Quaker oats…"
                }
                autoComplete="off"
                style={{
                  ...inp,
                  width: "100%",
                  boxSizing: "border-box",
                  borderColor: selectedFood ? modeColor : "var(--border)",
                  outline: selectedFood ? `1px solid ${modeColor}` : "none",
                }}
              />

              {/* ── Dropdown ── */}
              {open && (
                <div
                  ref={dropdownRef}
                  style={{
                    position: "absolute",
                    top: "calc(100% + 2px)",
                    left: 0,
                    right: 0,
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    boxShadow: "var(--shadow-md)",
                    zIndex: 200,
                    maxHeight: 280,
                    overflowY: "auto",
                  }}
                >
                  {/* Loading */}
                  {loading && (
                    <div style={{ padding: "10px 12px", fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
                      Searching…
                    </div>
                  )}

                  {/* Error */}
                  {!loading && error && (
                    <div style={{ padding: "10px 12px", fontSize: 12, color: "#e53935" }}>
                      Error fetching results — check connection or switch to Manual.
                    </div>
                  )}

                  {/* No results */}
                  {!loading && !error && results.length === 0 && (
                    <div style={{ padding: "10px 12px", fontSize: 12, color: "var(--text-muted)" }}>
                      No matches — try simpler terms or switch to Manual entry.
                    </div>
                  )}

                  {/* Results */}
                  {!loading && results.map((item, i) => (
                    <div
                      key={item.foodId ?? item.productId}
                      // onMouseDown prevents input blur before selection fires
                      onMouseDown={(e) => { e.preventDefault(); handleSelectResult(item); }}
                      onMouseEnter={() => setHighlightedIndex(i)}
                      style={{
                        padding: "8px 12px",
                        cursor: "pointer",
                        background: i === highlightedIndex
                          ? (mode === "generic" ? "#f1f8e9" : "#e8f0fe")
                          : "var(--bg-card)",
                        borderBottom: i < results.length - 1 ? "1px solid var(--border)" : "none",
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{item.name}</div>
                      {item.brand && (
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{item.brand}</div>
                      )}
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>
                        per 100g: {item.per100g.calories} kcal · P:{item.per100g.proteinG}g ·
                        C:{item.per100g.carbsG}g · F:{item.per100g.fatG}g · Fiber:{item.per100g.fiberG}g
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Grams input */}
            <input
              type="number"
              value={grams}
              onChange={(e) => setGrams(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
              placeholder="Grams"
              min="1"
              style={{ ...inp, width: 80 }}
            />
          </div>

          {/* ── Post-selection area ── */}
          {selectedFood && (
            <div style={{ marginTop: 8 }}>
              {/* Computed macro preview */}
              {searchPreview ? (
                <div
                  style={{
                    background: "#e8f5e9",
                    border: "1px solid #a5d6a7",
                    borderRadius: 4,
                    padding: "6px 10px",
                    fontSize: 12,
                    color: "#1b5e20",
                    marginBottom: 8,
                  }}
                >
                  <strong>{g}g</strong> of {selectedFood.name}:{" "}
                  {searchPreview.calories} kcal · P:{searchPreview.proteinG}g ·
                  C:{searchPreview.carbsG}g · F:{searchPreview.fatG}g · Fiber:{searchPreview.fiberG}g
                </div>
              ) : (
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 8px", fontStyle: "italic" }}>
                  Enter grams to calculate nutrition.
                </p>
              )}

              {/* Confirm button */}
              <button
                type="button"
                onClick={handleAddSearchItem}
                style={{
                  padding: "7px 18px",
                  background: modeColor,
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                {isEditing ? "Update item" : "Add item"}
              </button>
            </div>
          )}

          {/* Hint when nothing selected yet */}
          {!selectedFood && query.trim().length < 2 && (
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>
              Start typing to search…
            </p>
          )}
        </div>
      )}

      {/* ══ Manual mode ══ */}
      {mode === "manual" && (
        <>
          {/* Name + Grams */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            <input
              type="text"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
              placeholder="Food name (e.g. besan cheela, dal tadka)"
              style={{ ...inp, flex: "1 1 180px", minWidth: 0 }}
            />
            <input
              type="number"
              value={grams}
              onChange={(e) => setGrams(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
              placeholder="Grams"
              min="1"
              style={{ ...inp, width: 80 }}
            />
          </div>

          {/* Basis radio */}
          <div style={{ display: "flex", gap: 20, marginBottom: 10, fontSize: 13, color: "var(--text-secondary)" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}>
              <input
                type="radio"
                name={radioName}
                value="per100g"
                checked={basis === "per100g"}
                onChange={() => setBasis("per100g")}
              />
              Values are per 100g
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}>
              <input
                type="radio"
                name={radioName}
                value="absolute"
                checked={basis === "absolute"}
                onChange={() => setBasis("absolute")}
              />
              Values are for {grams || "?"} g total
            </label>
          </div>

          {/* Macro inputs */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            {MACRO_FIELDS.map(({ key, label }) => (
              <label key={key} style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 12, color: "var(--text-secondary)" }}>
                {label}
                <input
                  type="number"
                  value={manualValues[key]}
                  onChange={(e) => setManualValues({ ...manualValues, [key]: e.target.value })}
                  onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                  min="0"
                  step="0.1"
                  placeholder="0"
                  style={{ ...inp, width: 82, padding: "5px 7px" }}
                />
              </label>
            ))}
          </div>

          {/* Live preview */}
          {previewHasData && (
            <div
              style={{
                background: "#f3e5f5",
                border: "1px solid #ce93d8",
                borderRadius: 4,
                padding: "6px 10px",
                fontSize: 12,
                color: "#4a148c",
                marginBottom: 10,
              }}
            >
              Preview for {g}g: {manualPreview.calories} kcal · P:{manualPreview.proteinG}g ·
              C:{manualPreview.carbsG}g · F:{manualPreview.fatG}g · Fiber:{manualPreview.fiberG}g
            </div>
          )}

          {/* Add / Update */}
          <button
            type="button"
            onClick={handleManualAdd}
            style={{
              padding: "7px 18px",
              background: "#6a1b9a",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            {isEditing ? "Update item" : "Add item"}
          </button>
        </>
      )}

      {/* ── Cancel (edit mode only) ── */}
      {isEditing && (
        <button
          type="button"
          onClick={onCancelEdit}
          style={{
            marginTop: 8,
            marginLeft: 8,
            padding: "6px 12px",
            background: "none",
            border: "1px solid var(--border)",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 12,
            color: "var(--text-secondary)",
            display: "inline-block",
          }}
        >
          Cancel
        </button>
      )}
    </div>
  );
}
