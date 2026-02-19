import { useState, useEffect, useRef, useMemo } from "react";
import { WORKOUT_LIBRARY, CATEGORY_ORDER, calcCaloriesBurned } from "../utils/workoutLibrary";
import { useAccent } from "../context/AccentContext";

// ── Date helpers ──────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateLabel(dateStr) {
  const t    = todayStr();
  const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (dateStr === t)    return "Today";
  if (dateStr === yest) return "Yesterday";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

// ── Analytics helpers ─────────────────────────────────────────────────────────

function calcWorkoutStreak(workouts) {
  const today = todayStr();
  const yest  = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const days  = new Set(Object.keys(workouts).filter((d) => (workouts[d] || []).length > 0));
  const start = days.has(today) ? today : days.has(yest) ? yest : null;
  if (!start) return 0;
  let streak = 1;
  const cur = new Date(start + "T00:00:00");
  cur.setDate(cur.getDate() - 1);
  while (days.has(cur.toISOString().slice(0, 10))) {
    streak++;
    cur.setDate(cur.getDate() - 1);
  }
  return streak;
}

function calcWeeklyMinutes(workouts) {
  let total = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const entries = workouts[d.toISOString().slice(0, 10)] || [];
    total += entries.reduce((s, e) => s + (e.durationMin || 0), 0);
  }
  return total;
}

function calcPRs(workouts) {
  let longestSession = 0, highestSingleBurn = 0, highestDailyBurn = 0;
  Object.values(workouts).forEach((entries) => {
    const dayBurn = entries.reduce((s, e) => s + (e.caloriesBurned || 0), 0);
    if (dayBurn > highestDailyBurn) highestDailyBurn = dayBurn;
    entries.forEach((e) => {
      if ((e.durationMin    || 0) > longestSession)    longestSession    = e.durationMin;
      if ((e.caloriesBurned || 0) > highestSingleBurn) highestSingleBurn = e.caloriesBurned;
    });
  });
  return { longestSession, highestSingleBurn, highestDailyBurn };
}

function calc7DayBreakdown(workouts) {
  const breakdown = { Cardio: 0, Strength: 0, Other: 0 };
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const entries = workouts[d.toISOString().slice(0, 10)] || [];
    entries.forEach((e) => {
      const cat = Object.prototype.hasOwnProperty.call(breakdown, e.category) ? e.category : "Other";
      breakdown[cat] += e.durationMin || 0;
    });
  }
  return breakdown;
}

// ── Custom workout intensity → MET ───────────────────────────────────────────

const INTENSITY_METS = {
  Cardio:   { Easy: 4.0, Moderate: 6.5, Hard: 10.0 },
  Strength: { Easy: 3.0, Moderate: 5.0, Hard:  6.5 },
  Other:    { Easy: 3.5, Moderate: 5.5, Hard:  8.0 },
};

// ── Shared styles ─────────────────────────────────────────────────────────────

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

export default function Workouts({ workouts, activeUser, onSaveWorkout, onDeleteWorkout }) {
  const { primary: accentPrimary } = useAccent();
  const username   = activeUser.username;
  const weeklyGoal = Number(activeUser.profile?.weeklyActiveMinutesGoal) || 150;

  // ── Form mode (standard vs custom) ──────────────────────────────────────
  const [isCustom, setIsCustom] = useState(false);

  // ── Standard workout form ────────────────────────────────────────────────
  const [date,        setDate]        = useState(todayStr);
  const [duration,    setDuration]    = useState("");
  const [rawQuery,    setRawQuery]    = useState(""); // what the user types
  const [filterQuery, setFilterQuery] = useState(""); // debounced ≥2 chars
  const [selected,    setSelected]    = useState(null); // { name, category, met }

  // ── Autocomplete state ───────────────────────────────────────────────────
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIdx,    setActiveIdx]    = useState(-1);
  const containerRef  = useRef(null);
  const activeItemRef = useRef(null);

  // ── Custom workout form ──────────────────────────────────────────────────
  const [customName,     setCustomName]     = useState("");
  const [customCategory, setCustomCategory] = useState("Cardio");
  const [intensity,      setIntensity]      = useState("Moderate");

  // ── Debounce rawQuery → filterQuery (300 ms, min 2 chars) ────────────────
  useEffect(() => {
    if (rawQuery.length < 2) { setFilterQuery(""); return; }
    const t = setTimeout(() => setFilterQuery(rawQuery), 300);
    return () => clearTimeout(t);
  }, [rawQuery]);

  // ── Close dropdown on outside click ─────────────────────────────────────
  useEffect(() => {
    function onOut(e) {
      if (containerRef.current && !containerRef.current.contains(e.target))
        setShowDropdown(false);
    }
    document.addEventListener("mousedown", onOut);
    return () => document.removeEventListener("mousedown", onOut);
  }, []);

  // ── Scroll highlighted item into view on arrow-key nav ───────────────────
  useEffect(() => {
    activeItemRef.current?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  // ── Filtered + grouped workout list ─────────────────────────────────────
  const queryLower = filterQuery.trim().toLowerCase();
  const filtered   = queryLower.length >= 2
    ? WORKOUT_LIBRARY.filter((w) => w.name.toLowerCase().includes(queryLower))
    : WORKOUT_LIBRARY;

  const grouped  = CATEGORY_ORDER
    .map((cat) => ({ cat, items: filtered.filter((w) => w.category === cat) }))
    .filter((g) => g.items.length > 0);
  const flatList = grouped.flatMap((g) => g.items);

  // ── Autocomplete handlers ────────────────────────────────────────────────

  function selectWorkout(workout) {
    setSelected(workout);
    setRawQuery(workout.name);
    setFilterQuery(workout.name);
    setShowDropdown(false);
    setActiveIdx(-1);
  }

  function handleSearchChange(e) {
    const v = e.target.value;
    setRawQuery(v);
    setSelected(null);
    setShowDropdown(true);
    setActiveIdx(-1);
  }

  function handleSearchKeyDown(e) {
    if (!showDropdown) { if (e.key === "ArrowDown") setShowDropdown(true); return; }
    if      (e.key === "ArrowDown")            { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, flatList.length - 1)); }
    else if (e.key === "ArrowUp")              { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && activeIdx >= 0) { e.preventDefault(); selectWorkout(flatList[activeIdx]); }
    else if (e.key === "Escape")               { setShowDropdown(false); }
  }

  // ── Weight + live calorie preview ────────────────────────────────────────
  const weightKg    = Number(activeUser.profile?.weightKg) || null;
  const effectiveMet = isCustom
    ? (INTENSITY_METS[customCategory]?.[intensity] ?? 5.0)
    : (selected?.met ?? null);

  const liveCalories =
    effectiveMet && duration && weightKg
      ? calcCaloriesBurned(effectiveMet, weightKg, Number(duration))
      : null;

  // ── Form submission ──────────────────────────────────────────────────────

  function handleAdd(e) {
    e.preventDefault();
    if (!duration || !date) return;
    const w   = weightKg ?? 70;
    const met = effectiveMet ?? 5.0;
    const workoutName = isCustom ? (customName.trim() || "Custom workout") : selected?.name;
    const category    = isCustom ? customCategory : selected?.category;
    if (!isCustom && !selected) return;

    const entry = {
      id:             `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date,
      workoutName,
      category,
      durationMin:    Number(duration),
      met,
      caloriesBurned: calcCaloriesBurned(met, w, Number(duration)),
    };
    onSaveWorkout(entry);
    setRawQuery(""); setFilterQuery(""); setSelected(null);
    setDuration("");
    setCustomName("");
  }

  // ── Workout history (newest first) ───────────────────────────────────────
  const dateEntries = useMemo(
    () => Object.entries(workouts).sort(([a], [b]) => b.localeCompare(a)),
    [workouts]
  );

  const maxBurn = useMemo(() => {
    const burns = dateEntries.map(([, es]) => es.reduce((s, e) => s + e.caloriesBurned, 0));
    return Math.max(...burns, 1);
  }, [dateEntries]);

  // ── Analytics ────────────────────────────────────────────────────────────
  const hasWorkouts   = Object.keys(workouts).length > 0;
  const streak        = useMemo(() => calcWorkoutStreak(workouts), [workouts]);
  const weeklyMinutes = useMemo(() => calcWeeklyMinutes(workouts), [workouts]);
  const prs           = useMemo(() => calcPRs(workouts), [workouts]);
  const breakdown     = useMemo(() => calc7DayBreakdown(workouts), [workouts]);

  // Persist best streak
  useEffect(() => {
    const key     = `fitlog_best_streak_${username}`;
    const current = Number(localStorage.getItem(key)) || 0;
    if (streak > current) localStorage.setItem(key, String(streak));
  }, [streak, username]);
  const bestStreak = Number(localStorage.getItem(`fitlog_best_streak_${username}`)) || streak;

  const weeklyPct    = Math.min(100, (weeklyMinutes / weeklyGoal) * 100);
  const breakdownMax = Math.max(...Object.values(breakdown), 1);

  const hasRecentWorkouts = useMemo(() => {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return Object.keys(workouts).some((d) => new Date(d + "T00:00:00") >= cutoff);
  }, [workouts]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="page">
      <h1 className="page-title">🏋️ Workouts</h1>

      {/* ── Analytics Panel ── */}
      {hasWorkouts && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 className="card-title" style={{ marginBottom: 16 }}>📊 Your Stats</h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 18 }}>

            {/* Streak */}
            <div style={{ background: "var(--bg-secondary)", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                Workout Streak
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 32, fontWeight: 800, color: streak > 0 ? accentPrimary : "var(--text-muted)" }}>
                  {streak}
                </span>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>days</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                Best: <strong style={{ color: "var(--text-primary)" }}>{bestStreak}</strong> days
              </div>
            </div>

            {/* Weekly goal */}
            <div style={{ background: "var(--bg-secondary)", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Weekly Active Minutes
                </div>
                <div style={{ fontSize: 12, color: weeklyPct >= 100 ? "#22c55e" : "var(--text-muted)", fontWeight: weeklyPct >= 100 ? 700 : 400 }}>
                  {weeklyMinutes} / {weeklyGoal}
                </div>
              </div>
              <div style={{ background: "var(--border)", borderRadius: 999, height: 8, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 999, background: weeklyPct >= 100 ? "#22c55e" : accentPrimary, width: `${weeklyPct}%`, transition: "width 0.6s ease" }} />
              </div>
              {weeklyPct >= 100 && (
                <div style={{ fontSize: 12, color: "#16a34a", marginTop: 6, fontWeight: 600 }}>
                  🎉 Goal reached this week!
                </div>
              )}
            </div>

            {/* PRs */}
            <div style={{ background: "var(--bg-secondary)", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                Personal Records
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {[
                  { label: "Longest session",    value: `${prs.longestSession} min`                    },
                  { label: "Highest single burn", value: `${prs.highestSingleBurn.toLocaleString()} kcal` },
                  { label: "Highest daily burn",  value: `${prs.highestDailyBurn.toLocaleString()} kcal`  },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "var(--text-secondary)" }}>{label}</span>
                    <strong style={{ color: "var(--text-primary)" }}>{value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 7-day type breakdown */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
              7-Day Activity Mix
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {CATEGORY_ORDER.map((cat) => {
                const mins = breakdown[cat] || 0;
                const pct  = Math.min(100, (mins / breakdownMax) * 100);
                const catColor = cat === "Cardio" ? "#ef4444" : cat === "Strength" ? "#3b82f6" : "#8b5cf6";
                return (
                  <div key={cat} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 72, fontSize: 12, color: "var(--text-secondary)", flexShrink: 0 }}>{cat}</div>
                    <div style={{ flex: 1, background: "var(--border)", borderRadius: 999, height: 8, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 999, background: catColor, width: `${pct}%`, transition: "width 0.6s ease" }} />
                    </div>
                    <div style={{ width: 56, fontSize: 12, color: "var(--text-secondary)", textAlign: "right", flexShrink: 0 }}>
                      {mins} min
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Add Workout card ── */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 className="card-title" style={{ margin: 0 }}>Add Workout</h2>
          {/* Standard / Custom toggle */}
          <div style={{ display: "flex", gap: 6 }}>
            {["Standard", "Custom"].map((mode) => {
              const active = isCustom ? mode === "Custom" : mode === "Standard";
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setIsCustom(mode === "Custom");
                    setSelected(null);
                    setRawQuery(""); setFilterQuery("");
                  }}
                  style={{
                    padding: "5px 14px",
                    borderRadius: 6,
                    border: "1px solid var(--border)",
                    background: active ? accentPrimary : "var(--bg-secondary)",
                    color:      active ? "#fff"        : "var(--text-secondary)",
                    fontSize: 12, cursor: "pointer", fontWeight: 600,
                  }}
                >
                  {mode}
                </button>
              );
            })}
          </div>
        </div>

        {/* Weight warning */}
        {!weightKg && (
          <div style={{ background: "var(--accent-light)", border: "1px solid var(--accent)", borderRadius: 8, padding: "8px 14px", fontSize: 13, color: "var(--accent)", marginBottom: 16 }}>
            💡 Add your weight in <strong>Settings → Edit profile</strong> for accurate calorie estimates.
            Using 70 kg as a fallback.
          </div>
        )}

        <form onSubmit={handleAdd}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 16 }}>

            {/* Date */}
            <label style={labelSt}>
              Date
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={todayStr()}
                required
                style={inp}
              />
            </label>

            {/* Standard: autocomplete */}
            {!isCustom && (
              <div ref={containerRef} style={{ position: "relative", ...labelSt }}>
                <span>Workout type *</span>
                <input
                  type="text"
                  value={rawQuery}
                  onChange={handleSearchChange}
                  onFocus={() => setShowDropdown(true)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Type ≥ 2 chars to search…"
                  autoComplete="off"
                  required
                  style={{
                    ...inp,
                    borderColor: selected ? accentPrimary : undefined,
                    outline:     selected ? `1px solid ${accentPrimary}` : undefined,
                  }}
                />

                {showDropdown && (
                  <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, boxShadow: "var(--shadow-md)", zIndex: 200, maxHeight: 268, overflowY: "auto" }}>
                    {rawQuery.length < 2 ? (
                      <div style={{ padding: "10px 12px", fontSize: 12, color: "var(--text-muted)" }}>
                        Type at least 2 characters to filter…
                      </div>
                    ) : flatList.length === 0 ? (
                      <div style={{ padding: "10px 12px", fontSize: 12, color: "var(--text-muted)" }}>
                        No matches. Try the <strong>Custom</strong> mode for unlisted workouts.
                      </div>
                    ) : (
                      grouped.map(({ cat, items }) => (
                        <div key={cat}>
                          <div style={{ padding: "6px 12px 4px", fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.7px", background: "var(--bg-secondary)", position: "sticky", top: 0 }}>
                            {cat}
                          </div>
                          {items.map((item) => {
                            const idx      = flatList.indexOf(item);
                            const isActive = idx === activeIdx;
                            return (
                              <div
                                key={item.name}
                                ref={isActive ? activeItemRef : undefined}
                                onMouseDown={() => selectWorkout(item)}
                                onMouseEnter={() => setActiveIdx(idx)}
                                style={{ padding: "8px 12px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", background: isActive ? "var(--accent-light)" : "var(--bg-card)", color: isActive ? "var(--accent)" : "var(--text-primary)", fontSize: 13.5, transition: "background 0.1s" }}
                              >
                                <span>{item.name}</span>
                                <span style={{ fontSize: 11, color: isActive ? "var(--accent)" : "var(--text-muted)", marginLeft: 8, flexShrink: 0 }}>
                                  MET {item.met}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Custom: name + category + intensity */}
            {isCustom && (
              <>
                <label style={labelSt}>
                  Workout name
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Beach volleyball"
                    style={inp}
                  />
                </label>

                <label style={labelSt}>
                  Category
                  <select value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} style={inp}>
                    {CATEGORY_ORDER.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </label>

                <label style={labelSt}>
                  Intensity
                  <select value={intensity} onChange={(e) => setIntensity(e.target.value)} style={inp}>
                    {["Easy", "Moderate", "Hard"].map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl} — MET {INTENSITY_METS[customCategory][lvl]}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}

            {/* Duration */}
            <label style={labelSt}>
              Duration (minutes) *
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="1"
                max="600"
                placeholder="e.g. 30"
                required
                style={inp}
              />
            </label>
          </div>

          {/* Live preview + submit */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            {liveCalories != null && (
              <div style={{ background: "var(--accent-light)", border: `1px solid ${accentPrimary}`, borderRadius: 8, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>🔥</span>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "var(--accent)", lineHeight: 1 }}>
                    {liveCalories.toLocaleString()} kcal
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                    {weightKg} kg × MET {effectiveMet} × {duration} min
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={!duration || !date || (!isCustom && !selected)}
              style={{ fontSize: 14, opacity: !duration || (!isCustom && !selected) ? 0.5 : 1 }}
            >
              + Add Workout
            </button>
          </div>
        </form>
      </div>

      {/* ── No workouts nudge ── */}
      {!hasWorkouts && !hasRecentWorkouts && (
        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 18px", marginBottom: 20, display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 18 }}>💡</span>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Log workouts to track calorie burn, build your streak, and improve deficit calculations.
          </span>
        </div>
      )}

      {/* ── Workout history ── */}
      {dateEntries.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "44px 24px" }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🏃</div>
          <p style={{ color: "var(--text-secondary)", margin: 0 }}>No workouts logged yet. Add your first one above!</p>
        </div>
      ) : (
        dateEntries.map(([dateKey, entries]) => {
          const totalBurn = entries.reduce((s, e) => s + e.caloriesBurned, 0);
          const totalMins = entries.reduce((s, e) => s + e.durationMin,     0);
          const barPct    = Math.min(100, (totalBurn / maxBurn) * 100);

          return (
            <div key={dateKey} className="card" style={{ marginBottom: 16, padding: "20px 22px" }}>

              {/* Date header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                <div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                    {formatDateLabel(dateKey)}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 8 }}>{dateKey}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{totalMins} min</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                    🔥 {totalBurn.toLocaleString()} kcal
                  </span>
                  {totalBurn >= 500 && (
                    <span style={{ background: "var(--accent-light)", color: "var(--accent)", border: "1px solid var(--accent)", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>
                      High activity day
                    </span>
                  )}
                </div>
              </div>

              {/* Burn bar */}
              <div style={{ background: "var(--border)", borderRadius: 4, height: 5, marginBottom: 14, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${barPct}%`, background: accentPrimary, borderRadius: 4, transition: "width 0.6s ease" }} />
              </div>

              {/* Individual entries */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {entries.map((entry) => (
                  <div key={entry.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-secondary)", borderRadius: 8, padding: "10px 14px", gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {entry.workoutName}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                        {entry.durationMin} min · {entry.category} · MET {entry.met}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: accentPrimary }}>
                        {entry.caloriesBurned.toLocaleString()} kcal
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>burned</div>
                    </div>
                    <button
                      onClick={() => onDeleteWorkout(dateKey, entry.id)}
                      className="btn-danger"
                      style={{ fontSize: 12, padding: "5px 10px", flexShrink: 0 }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      <div style={{ height: 24 }} />
    </div>
  );
}
