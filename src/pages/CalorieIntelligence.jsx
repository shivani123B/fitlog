import { useState, useEffect } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────

const ACTIVITY_LEVELS = [
  { label: "Sedentary (desk job, little/no exercise)",   value: "1.2"   },
  { label: "Lightly active (light exercise 1–3x/week)",  value: "1.375" },
  { label: "Moderately active (moderate exercise 3–5x)", value: "1.55"  },
  { label: "Very active (hard exercise 6–7x/week)",      value: "1.725" },
  { label: "Athlete (2× training/day, physical job)",    value: "1.9"   },
];

// ── Calorie helpers ────────────────────────────────────────────────────────────

// Mifflin-St Jeor BMR formula
function calcBMR(weightKg, heightCm, age, gender) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === "female" ? base - 161 : base + 5;
}

function weeklyAvgCal(logs) {
  const sorted = [...logs]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7)
    .filter((l) => l.calories != null);
  if (sorted.length === 0) return null;
  return Math.round(sorted.reduce((s, l) => s + l.calories, 0) / sorted.length);
}

// ── Workout burn helpers ───────────────────────────────────────────────────────

// Total calories burned from workouts on a given date string "YYYY-MM-DD".
function calcDailyBurn(workouts, date) {
  return (workouts[date] || []).reduce((s, w) => s + (w.caloriesBurned || 0), 0);
}

// Average daily workout burn over the past 7 calendar days (0-burn days count).
// Using 7 as denominator keeps the number conservative — matches 7-day habit cadence.
function calcAvgBurn(workouts) {
  let total = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    total += calcDailyBurn(workouts, d.toISOString().slice(0, 10));
  }
  return Math.round(total / 7);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TargetCard({ label, calories, note, accent }) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderTop: `3px solid ${accent}`,
        borderRadius: 10,
        padding: "16px 14px",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1, marginBottom: 4 }}>
        {calories.toLocaleString()}
      </div>
      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>kcal/day</div>
      {note && (
        <div style={{ fontSize: 11, color: accent, marginTop: 6, fontWeight: 500 }}>
          {note}
        </div>
      )}
    </div>
  );
}

// StatusBadge now receives the true (net) deficit so it reflects exercise.
function StatusBadge({ deficit }) {
  if (deficit == null) return null;

  let bg, color, icon, message;
  if (deficit >= 200 && deficit <= 500) {
    bg = "#dcfce7"; color = "#15803d"; icon = "✓";
    message = "Safe fat loss zone";
  } else if (deficit > 500 && deficit <= 700) {
    bg = "#fef9c3"; color = "#854d0e"; icon = "⚡";
    message = "Moderate cut — monitor energy levels";
  } else if (deficit > 700) {
    bg = "#ffedd5"; color = "#9a3412"; icon = "⚠";
    message = `Aggressive cut (${deficit} kcal) — risk of muscle loss`;
  } else if (deficit < -50) {
    bg = "#dbeafe"; color = "#1e40af"; icon = "💪";
    message = `Caloric surplus (${Math.abs(deficit)} kcal) — bulking phase`;
  } else {
    bg = "var(--bg-secondary)"; color = "var(--text-secondary)"; icon = "~";
    message = "Near maintenance — body recomposition range";
  }

  return (
    <div style={{ background: bg, borderRadius: 8, padding: "8px 14px", display: "inline-flex", alignItems: "center", gap: 8, marginTop: 10 }}>
      <span style={{ fontSize: 15 }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color }}>{message}</span>
    </div>
  );
}

// ── Shared form styles ────────────────────────────────────────────────────────

const inp = {
  padding: "8px 10px",
  border: "1px solid var(--border)",
  borderRadius: 6,
  fontSize: 14,
  width: "100%",
  boxSizing: "border-box",
};

const labelSt = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  fontSize: 13,
  color: "var(--text-secondary)",
};

// ── Main component ────────────────────────────────────────────────────────────

export default function CalorieIntelligence({ logs, activeUser, onUpdateUser, workouts = {} }) {
  const profile = activeUser.profile || {};

  // Load persisted inputs from localStorage, falling back to profile values
  function loadInputs() {
    try {
      const saved = JSON.parse(
        localStorage.getItem(`fitlog_calorie_intel_${activeUser.username}`)
      );
      if (saved) return saved;
    } catch { /* ignore */ }

    // First visit — pre-fill from profile
    const g = (profile.gender || "").toLowerCase();
    return {
      age:           String(profile.age      || ""),
      gender:        g === "female" ? "female" : g === "male" ? "male" : "",
      heightCm:      String(profile.heightCm || ""),
      weightKg:      String(profile.weightKg || ""),
      activityLevel: "1.55",
      goalWeightKg:  String(profile.goalWeightKg || ""),
    };
  }

  const [inputs,       setInputs]       = useState(loadInputs);
  const [profileSaved, setProfileSaved] = useState(false);

  // Auto-save inputs to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(
      `fitlog_calorie_intel_${activeUser.username}`,
      JSON.stringify(inputs)
    );
  }, [inputs, activeUser.username]);

  function handleChange(e) {
    setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSaveToProfile() {
    onUpdateUser({
      ...profile,
      goalWeightKg: inputs.goalWeightKg !== "" ? Number(inputs.goalWeightKg) : null,
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  }

  // ── Derived calorie calculations ──────────────────────────────────────────

  const w    = Number(inputs.weightKg)      || null;
  const h    = Number(inputs.heightCm)      || null;
  const age  = Number(inputs.age)           || null;
  const g    = inputs.gender;
  const mult = Number(inputs.activityLevel) || 1.55;
  const goal = Number(inputs.goalWeightKg)  || null;

  const bmr  = (w && h && age && g) ? Math.round(calcBMR(w, h, age, g)) : null;
  const tdee = bmr ? Math.round(bmr * mult) : null;

  const avgCal      = weeklyAvgCal(logs);
  // Standard deficit: intake vs TDEE (no exercise factored in)
  const deficit     = (tdee && avgCal != null) ? tdee - avgCal : null;
  const weeklyFatKg = deficit != null ? (deficit * 7 / 7700) : null;

  const proteinMaint   = w ? Math.round(w * 1.2) : null;
  const proteinCutLow  = w ? Math.round(w * 1.6) : null;
  const proteinCutHigh = w ? Math.round(w * 2.0) : null;
  const waterL         = w ? (w * 35 / 1000).toFixed(1) : null;

  const isCalculable = bmr != null;

  // ── Workout burn calculations ─────────────────────────────────────────────

  const todayStr      = new Date().toISOString().slice(0, 10);
  const todayBurn     = calcDailyBurn(workouts, todayStr);
  const avgBurn       = calcAvgBurn(workouts);
  const hasWorkouts   = Object.keys(workouts).length > 0;

  // True deficit = (TDEE + avg workout burn) - intake
  // This gives the full picture: if you burned 300 kcal working out and ate 500
  // below maintenance, your real daily deficit is 800 kcal, not 500.
  const netDeficit    = (tdee && avgCal != null) ? (tdee + avgBurn) - avgCal  : null;
  const netWeeklyFat  = netDeficit != null       ? (netDeficit * 7 / 7700)    : null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="page">
      <h1 className="page-title">🧠 Calorie Intelligence</h1>

      {/* ── Section A: Your Metrics ── */}
      <div className="card">
        <h2 className="card-title">Your Metrics</h2>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 18 }}>
          Pre-filled from your profile. Changes auto-save to this browser.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 16 }}>

          <label style={labelSt}>
            Age (years) *
            <input type="number" name="age" value={inputs.age} onChange={handleChange} min="1" max="120" placeholder="e.g. 28" style={inp} />
          </label>

          <label style={labelSt}>
            Biological sex *
            <select name="gender" value={inputs.gender} onChange={handleChange} style={inp}>
              <option value="">Select…</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </label>

          <label style={labelSt}>
            Height (cm) *
            <input type="number" name="heightCm" value={inputs.heightCm} onChange={handleChange} min="50" max="300" placeholder="e.g. 170" style={inp} />
          </label>

          <label style={labelSt}>
            Weight (kg) *
            <input type="number" name="weightKg" value={inputs.weightKg} onChange={handleChange} step="0.1" min="0" placeholder="e.g. 70.5" style={inp} />
          </label>

          <label style={{ ...labelSt, gridColumn: "span 2" }}>
            Activity Level *
            <select name="activityLevel" value={inputs.activityLevel} onChange={handleChange} style={inp}>
              {ACTIVITY_LEVELS.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </label>

          <label style={labelSt}>
            Goal Weight (kg) — optional
            <input type="number" name="goalWeightKg" value={inputs.goalWeightKg} onChange={handleChange} step="0.1" min="0" placeholder="e.g. 65.0" style={inp} />
          </label>
        </div>

        {/* Save goal to profile */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button className="btn-secondary" style={{ fontSize: 13 }} onClick={handleSaveToProfile}>
            {profileSaved ? "✓ Saved to profile" : "Save goal weight to profile"}
          </button>
          {!isCalculable && (
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Fill age, sex, height, weight to see results.
            </span>
          )}
        </div>
      </div>

      {/* ── Section B: Calorie Targets ── */}
      {isCalculable && (
        <div className="card">
          <h2 className="card-title">Daily Calorie Targets</h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
            Based on Mifflin-St Jeor formula · BMR × {inputs.activityLevel} activity multiplier
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
            <TargetCard label="BMR"            calories={bmr}        note="Calories at complete rest"     accent="var(--accent)" />
            <TargetCard label="Maintenance"    calories={tdee}       note="No weight change expected"     accent="#10b981" />
            <TargetCard label="Fat Loss"       calories={tdee - 300} note="≈ −0.27 kg/week"              accent="#f59e0b" />
            <TargetCard label="Aggressive Cut" calories={tdee - 500} note="≈ −0.45 kg/week"              accent="#ef4444" />
            <TargetCard label="Lean Bulk"      calories={tdee + 300} note="≈ +0.27 kg/week"              accent="#3b82f6" />
          </div>
        </div>
      )}

      {/* ── Section B.5: Workout Activity ── */}
      {isCalculable && (
        <div className="card">
          <h2 className="card-title">🏋️ Workout Activity</h2>

          {!hasWorkouts ? (
            <p style={{ fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>
              Log workouts in the <strong>Workouts</strong> tab to factor calorie burn
              into your deficit calculations.
            </p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                  Today's Burn
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: todayBurn > 0 ? "var(--accent)" : "var(--text-primary)", lineHeight: 1 }}>
                  {todayBurn > 0 ? `${todayBurn.toLocaleString()} 🔥` : "—"}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                  kcal burned today
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                  7-Day Avg Burn
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: avgBurn > 0 ? "var(--accent)" : "var(--text-primary)", lineHeight: 1 }}>
                  {avgBurn > 0 ? avgBurn.toLocaleString() : "—"}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                  kcal/day average
                </div>
              </div>

              {netDeficit != null && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                    True Daily Deficit
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: netDeficit >= 200 ? "#22c55e" : netDeficit < 0 ? "#818cf8" : "var(--text-primary)", lineHeight: 1 }}>
                    {Math.abs(netDeficit).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                    kcal/day {netDeficit >= 0 ? "deficit" : "surplus"} (incl. burn)
                  </div>
                </div>
              )}

              {netWeeklyFat != null && Math.abs(netWeeklyFat) > 0.01 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                    Projected Weekly Change
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: netWeeklyFat > 0 ? "#22c55e" : "#818cf8", lineHeight: 1 }}>
                    {netWeeklyFat > 0 ? "−" : "+"}{Math.abs(netWeeklyFat).toFixed(2)}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                    kg fat/week (with exercise)
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Section C: vs Actual Intake ── */}
      {isCalculable && (
        <div className="card">
          <h2 className="card-title">vs. Your Actual Intake</h2>

          {avgCal == null ? (
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
              No calorie logs found. Add logs to see how your intake compares to your targets.
            </p>
          ) : (
            <div>
              {/* Comparison rows */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 16 }}>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                    7-Day Avg Intake
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)" }}>
                    {avgCal.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>kcal/day average</div>
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                    {deficit >= 0 ? "Deficit" : "Surplus"} (vs TDEE)
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: deficit >= 0 ? "#22c55e" : "#818cf8" }}>
                    {Math.abs(deficit).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>kcal/day · diet only</div>
                </div>

                {/* Workout burn column — only shown when workouts exist */}
                {hasWorkouts && avgBurn > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                      Avg Workout Burn
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "var(--accent)" }}>
                      +{avgBurn.toLocaleString()} 🔥
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>kcal/day · exercise</div>
                  </div>
                )}

                {/* Net deficit column — only shown when workouts + intake both exist */}
                {hasWorkouts && netDeficit != null && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                      Net {netDeficit >= 0 ? "Deficit" : "Surplus"}
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: netDeficit >= 200 ? "#22c55e" : netDeficit < 0 ? "#818cf8" : "var(--text-primary)" }}>
                      {Math.abs(netDeficit).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>kcal/day · diet + exercise</div>
                  </div>
                )}

                {/* Projected weekly fat change — use net deficit when available */}
                {(netWeeklyFat ?? weeklyFatKg) != null && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                      Projected Weekly Change
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: (netWeeklyFat ?? weeklyFatKg) > 0 ? "#22c55e" : "#818cf8" }}>
                      {(netWeeklyFat ?? weeklyFatKg) > 0 ? "−" : "+"}
                      {Math.abs((netWeeklyFat ?? weeklyFatKg)).toFixed(2)}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      kg fat / week {hasWorkouts && avgBurn > 0 ? "(incl. exercise)" : "(≈7700 kcal/kg)"}
                    </div>
                  </div>
                )}
              </div>

              {/* Intake bar — compares intake vs TDEE baseline */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
                  <span>Intake</span>
                  <span>Maintenance ({tdee?.toLocaleString()} kcal)</span>
                </div>
                <div style={{ background: "var(--border)", borderRadius: 999, height: 8, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      borderRadius: 999,
                      background: deficit >= 200 ? "#22c55e" : deficit < 0 ? "#818cf8" : "var(--accent)",
                      width: `${Math.min(100, (avgCal / tdee) * 100)}%`,
                      transition: "width 0.6s ease",
                    }}
                  />
                </div>
              </div>

              {/* StatusBadge uses net deficit when workout data is available */}
              <StatusBadge deficit={netDeficit ?? deficit} />
            </div>
          )}
        </div>
      )}

      {/* ── Sections D & E: Protein + Water ── */}
      {w && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>

          {/* Section D: Protein */}
          <div className="card" style={{ marginBottom: 0 }}>
            <h2 className="card-title">💪 Protein Recommendation</h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
              Based on your weight of {w} kg.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ background: "var(--bg-secondary)", borderRadius: 8, padding: "12px 16px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
                  Maintenance (1.2 g/kg)
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>
                  {proteinMaint} g
                  <span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-muted)", marginLeft: 6 }}>per day</span>
                </div>
              </div>

              <div style={{ background: "var(--accent-light)", borderRadius: 8, padding: "12px 16px", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
                  Fat Loss (1.6–2.0 g/kg)
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "var(--accent)" }}>
                  {proteinCutLow}–{proteinCutHigh} g
                  <span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-muted)", marginLeft: 6 }}>per day</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                  Higher protein preserves muscle while in a deficit.
                </div>
              </div>
            </div>
          </div>

          {/* Section E: Water */}
          <div className="card" style={{ marginBottom: 0 }}>
            <h2 className="card-title">💧 Daily Water Goal</h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
              Based on 35 ml per kg of body weight.
            </p>

            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 56, fontWeight: 800, color: "#3b82f6", letterSpacing: "-2px", lineHeight: 1 }}>
                {waterL}
              </div>
              <div style={{ fontSize: 18, color: "var(--text-secondary)", marginTop: 6 }}>
                litres / day
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
                {w} kg × 35 ml = {(w * 35).toLocaleString()} ml
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                ≈ {Math.round(w * 35 / 250)} glasses (250 ml each)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom padding */}
      <div style={{ height: 24 }} />
    </div>
  );
}
