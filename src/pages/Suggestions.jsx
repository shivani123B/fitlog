import { useState, useMemo } from "react";
import { FOOD_LIBRARY, filterByDiet } from "../utils/foodLibrary";

// ── BMR formula (Mifflin-St Jeor) ────────────────────────────────────────────
function calcBMR(weightKg, heightCm, age, gender) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === "female" ? base - 161 : base + 5;
}

function weeklyAvgCal(logs) {
  const recent = [...logs]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7)
    .filter((l) => l.calories != null);
  if (recent.length === 0) return null;
  return Math.round(recent.reduce((s, l) => s + l.calories, 0) / recent.length);
}

// 7-day average workout burn
function calcAvgBurn(workouts) {
  let total = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const entries = workouts[d.toISOString().slice(0, 10)] || [];
    total += entries.reduce((s, e) => s + (e.caloriesBurned || 0), 0);
  }
  return Math.round(total / 7);
}

// ── Seeded shuffle ────────────────────────────────────────────────────────────
function seededShuffle(arr, seed) {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const MEAL_SLOTS = [
  { key: "breakfast", label: "Breakfast", icon: "🍳", pct: 0.25 },
  { key: "lunch",     label: "Lunch",     icon: "🥗", pct: 0.35 },
  { key: "dinner",    label: "Dinner",    icon: "🍽️", pct: 0.30 },
  { key: "snacks",    label: "Snacks",    icon: "🥜", pct: 0.10 },
];

// Pick the item closest to budget; protein density earns a bonus in fat-loss mode.
function pickBestItem(shuffled, budget, fatLossMode) {
  if (shuffled.length === 0) return null;
  let best = shuffled[0];
  let bestScore = Infinity;
  for (const item of shuffled) {
    const dist         = Math.abs(item.cal - budget);
    const proteinBonus = fatLossMode ? (item.protein / item.cal) * 250 : 0;
    const score        = dist - proteinBonus;
    if (score < bestScore) { bestScore = score; best = item; }
  }
  return best;
}

// Build the full day plan for the given target calories, seed, and diet category.
function buildPlan(targetCal, fatLossMode, seed, dietCategory) {
  const plan = {};
  MEAL_SLOTS.forEach((slot, idx) => {
    const budget  = Math.round(targetCal * slot.pct);
    // Filter library by diet; fall back to unfiltered if the filter is too strict
    const base    = filterByDiet(FOOD_LIBRARY[slot.key], dietCategory);
    const source  = base.length > 0 ? base : FOOD_LIBRARY[slot.key];
    const shuffled = seededShuffle(source, seed + idx * 137);
    plan[slot.key] = { budget, items: pickBestItem(shuffled, budget, fatLossMode) ? [pickBestItem(shuffled, budget, fatLossMode)] : [] };
  });
  return plan;
}

// ── MealCard ──────────────────────────────────────────────────────────────────

function MealCard({ slot, data }) {
  const totalCal  = data.items.reduce((s, i) => s + i.cal,     0);
  const totalProt = data.items.reduce((s, i) => s + i.protein, 0);

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
        <h3 className="card-title" style={{ margin: 0 }}>{slot.icon} {slot.label}</h3>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Budget: ~{data.budget} kcal</span>
      </div>

      {data.items.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>No suggestion available for your diet preference.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {data.items.map((item, i) => (
            <div key={i} style={{ background: "var(--bg-secondary)", borderRadius: 8, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 14, color: "var(--text-primary)", flex: 1 }}>{item.name}</span>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{item.cal} kcal</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{item.protein} g protein</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)", display: "flex", gap: 20, fontSize: 12, color: "var(--text-secondary)" }}>
        <span>Total: <strong style={{ color: "var(--text-primary)" }}>{totalCal} kcal</strong></span>
        <span>Protein: <strong style={{ color: "var(--text-primary)" }}>{totalProt} g</strong></span>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Suggestions({ logs, activeUser, workouts = {}, onSaveLog }) {
  const [seed,     setSeed]     = useState(0);
  const [copyDone, setCopyDone] = useState(false);

  const profile = activeUser.profile || {};

  // Read CalorieIntelligence saved inputs; fall back to raw profile values
  const savedInputs = (() => {
    try {
      return JSON.parse(localStorage.getItem(`fitlog_calorie_intel_${activeUser.username}`));
    } catch { return null; }
  })();

  const w    = Number(savedInputs?.weightKg  ?? profile.weightKg)  || null;
  const h    = Number(savedInputs?.heightCm  ?? profile.heightCm)  || null;
  const age  = Number(savedInputs?.age       ?? profile.age)       || null;
  const mult = Number(savedInputs?.activityLevel) || 1.55;
  const goal = Number(savedInputs?.goalWeightKg ?? profile.goalWeightKg) || null;

  const rawGender   = savedInputs?.gender || (profile.gender ?? "");
  const genderLower = rawGender.toLowerCase().trim();
  const bmrGender   = genderLower === "female" ? "female" : genderLower === "male" ? "male" : null;

  const bmr  = (w && h && age && bmrGender) ? Math.round(calcBMR(w, h, age, bmrGender)) : null;
  const tdee = bmr ? Math.round(bmr * mult) : null;

  // 7-day avg workout burn → factored into effective TDEE
  const avgBurn       = useMemo(() => calcAvgBurn(workouts), [workouts]);
  const effectiveTDEE = tdee ? tdee + avgBurn : null;

  const avgCal      = weeklyAvgCal(logs);
  const fatLossMode = goal != null && w != null && goal < w;

  const dietCategory = profile.dietCategory || "";

  // Deficit selector — defaults to profile preference or 500 kcal
  const profileDeficit = Number(profile.preferredDeficit) || 500;
  const [deficitTarget, setDeficitTarget] = useState(profileDeficit);

  // Target = effectiveTDEE − deficit (fat-loss) or effectiveTDEE (maintenance)
  const rawTarget = fatLossMode && effectiveTDEE
    ? effectiveTDEE - deficitTarget
    : effectiveTDEE;
  const targetCal = rawTarget ? Math.round(rawTarget / 50) * 50 : null;

  const isTooLow  = bmr  != null && targetCal != null && targetCal < bmr + 100;
  const isTooHigh = tdee != null && targetCal != null && targetCal > tdee + 300;

  const plan = useMemo(() => {
    if (!targetCal) return null;
    return buildPlan(targetCal, fatLossMode, seed, dietCategory);
  }, [targetCal, fatLossMode, seed, dietCategory]);

  const totalCal     = plan ? MEAL_SLOTS.reduce((s, m) => s + (plan[m.key]?.items ?? []).reduce((a, i) => a + i.cal,     0), 0) : 0;
  const totalProtein = plan ? MEAL_SLOTS.reduce((s, m) => s + (plan[m.key]?.items ?? []).reduce((a, i) => a + i.protein, 0), 0) : 0;

  // Copy plan to tomorrow's log
  function handleCopyToLog() {
    if (!plan || !onSaveLog) return;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    onSaveLog({
      date:            tomorrow.toISOString().slice(0, 10),
      calories:        totalCal,
      proteinG:        totalProtein,
      carbsG:          null,
      fatG:            null,
      fiberG:          null,
      morningWeightKg: null,
      steps:           null,
      meals:           null,
    });
    setCopyDone(true);
    setTimeout(() => setCopyDone(false), 3000);
  }

  // ── No-data gate ──────────────────────────────────────────────────────────
  if (!w || !h || !age || !bmrGender) {
    return (
      <div className="page">
        <h1 className="page-title">🍽️ Suggestions</h1>
        <div className="card" style={{ textAlign: "center", padding: "52px 24px" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <h3 style={{ color: "var(--text-primary)", margin: "0 0 10px", fontSize: 18 }}>
            Complete your metrics first
          </h3>
          <p style={{ color: "var(--text-secondary)", margin: 0, maxWidth: 380, marginInline: "auto" }}>
            Fill in age, biological sex (male / female), height, and weight in
            the <strong>Calorie Intelligence</strong> page to unlock meal suggestions.
          </p>
        </div>
      </div>
    );
  }

  // ── Full view ─────────────────────────────────────────────────────────────
  return (
    <div className="page">
      <h1 className="page-title">🍽️ Suggested Food for Tomorrow</h1>

      {/* ── Summary card ── */}
      <div style={{ background: "var(--accent-light)", border: "1px solid var(--accent)", borderRadius: 14, padding: "20px 24px", marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 16, marginBottom: 14 }}>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 4 }}>Target for Tomorrow</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "var(--accent)" }}>{targetCal?.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>kcal / day</div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 4 }}>Suggested Calories</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)" }}>{totalCal.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>kcal approx</div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 4 }}>Suggested Protein</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)" }}>{totalProtein}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>grams approx</div>
          </div>

          {avgBurn > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 4 }}>Avg Workout Burn</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#f59e0b" }}>+{avgBurn}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>kcal/day factored in</div>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ background: fatLossMode ? "#fef3c7" : "#d1fae5", color: fatLossMode ? "#92400e" : "#065f46", border: `1px solid ${fatLossMode ? "#fbbf24" : "#6ee7b7"}`, borderRadius: 20, padding: "6px 14px", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
              {fatLossMode ? "🎯 Fat loss focus" : "⚖️ Maintenance focus"}
            </div>
          </div>
        </div>

        {/* Deficit selector (fat-loss mode) */}
        {fatLossMode && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Deficit target:</span>
            {[300, 500].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDeficitTarget(d)}
                style={{ padding: "4px 14px", borderRadius: 20, border: "1px solid var(--border)", background: deficitTarget === d ? "var(--accent)" : "var(--bg-secondary)", color: deficitTarget === d ? "#fff" : "var(--text-secondary)", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
              >
                −{d} kcal {d === 300 ? "(moderate)" : "(aggressive)"}
              </button>
            ))}
          </div>
        )}

        {/* Context line */}
        <div style={{ fontSize: 12, color: "var(--text-secondary)", borderTop: "1px solid var(--border)", paddingTop: 10, display: "flex", gap: 16, flexWrap: "wrap" }}>
          {avgCal != null && <span>7-day avg intake: <strong>{avgCal.toLocaleString()} kcal</strong></span>}
          {tdee && <span>TDEE: <strong>{tdee.toLocaleString()} kcal</strong></span>}
          {avgBurn > 0 && <span>Effective TDEE: <strong>{effectiveTDEE?.toLocaleString()} kcal</strong></span>}
          {dietCategory && <span>Diet: <strong>{dietCategory}</strong></span>}
        </div>
      </div>

      {/* ── Safety warnings ── */}
      {isTooLow && (
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#b91c1c" }}>Calories are very low</div>
            <div style={{ fontSize: 12, color: "#dc2626", marginTop: 2 }}>
              Target ({targetCal?.toLocaleString()} kcal) is near or below your BMR ({bmr?.toLocaleString()} kcal).
              Consider increasing by 100–200 kcal for safety.
            </div>
          </div>
        </div>
      )}

      {isTooHigh && (
        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ fontSize: 18 }}>ℹ️</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Above maintenance</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
              Target ({targetCal?.toLocaleString()} kcal) is 300+ kcal above maintenance. This may lead to weight gain over time.
            </div>
          </div>
        </div>
      )}

      {/* ── Meal sections ── */}
      {plan && MEAL_SLOTS.map((slot) => (
        <MealCard key={slot.key} slot={slot} data={plan[slot.key]} />
      ))}

      {/* ── Actions row ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <button
          className="btn-primary"
          onClick={() => { setSeed((s) => s + 1); setCopyDone(false); }}
          style={{ fontSize: 14 }}
        >
          🔀 Regenerate
        </button>

        {onSaveLog && (
          <button
            className="btn-secondary"
            onClick={handleCopyToLog}
            disabled={!plan}
            style={{
              fontSize: 14,
              background:   copyDone ? "#dcfce7"  : undefined,
              color:        copyDone ? "#15803d"  : undefined,
              borderColor:  copyDone ? "#86efac"  : undefined,
            }}
          >
            {copyDone ? "✓ Copied to tomorrow's log" : "📋 Copy plan to tomorrow's log"}
          </button>
        )}

        <span style={{ fontSize: 12, color: "var(--text-muted)", maxWidth: 500 }}>
          Suggestions are approximate. Adjust portions to match your preferences and schedule.
        </span>
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}
