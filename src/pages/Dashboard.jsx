import WeightChart        from "../components/WeightChart";
import SummaryCards       from "../components/SummaryCards";
import WeightProgressRing from "../components/WeightProgressRing";
import FitnessBackground  from "../components/FitnessBackground";

// Consecutive days ending at the most-recent log entry.
function computeStreak(logs) {
  if (logs.length === 0) return 0;
  const sorted  = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  const dateSet = new Set(sorted.map((l) => l.date));
  let streak = 1;
  const cur  = new Date(sorted[0].date);
  cur.setDate(cur.getDate() - 1);
  while (dateSet.has(cur.toISOString().slice(0, 10))) {
    streak++;
    cur.setDate(cur.getDate() - 1);
  }
  return streak;
}

function weeklyAvgCal(logs) {
  const last7 = [...logs]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7)
    .filter((l) => l.calories != null);
  if (last7.length === 0) return null;
  return Math.round(last7.reduce((s, l) => s + l.calories, 0) / last7.length);
}

// Read TDEE data from CalorieIntelligence localStorage cache
function loadTDEE(username) {
  try {
    const s = JSON.parse(localStorage.getItem(`fitlog_calorie_intel_${username}`));
    if (!s) return null;
    const w = Number(s.weightKg) || null;
    const h = Number(s.heightCm) || null;
    const a = Number(s.age)      || null;
    const g = s.gender;
    const m = Number(s.activityLevel) || 1.55;
    if (!w || !h || !a || !g) return null;
    const base = 10 * w + 6.25 * h - 5 * a;
    const bmr  = g === "female" ? base - 161 : base + 5;
    return Math.round(bmr * m);
  } catch { return null; }
}

export default function Dashboard({ logs, activeUser, workouts = {} }) {
  const sortedDesc   = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  const sortedAsc    = [...logs].sort((a, b) => a.date.localeCompare(b.date));

  // Weight data
  const withWeight   = sortedAsc.filter((l) => l.morningWeightKg != null);
  const startWeight  = withWeight.length > 0 ? withWeight[0].morningWeightKg : null;
  const latestWeight = withWeight.length > 0 ? withWeight[withWeight.length - 1].morningWeightKg : null;
  const goalWeight   = activeUser.profile?.goalWeightKg || null;

  const avgCal    = weeklyAvgCal(logs);
  const streak    = computeStreak(logs);
  const firstName = (activeUser.profile?.name || activeUser.username).split(" ")[0];

  // ── Today at a glance ──────────────────────────────────────────────────────
  const today        = new Date().toISOString().slice(0, 10);
  const todayLog     = logs.find((l) => l.date === today) || null;
  const todayIntake  = todayLog?.calories ?? null;
  const todayBurn    = (workouts[today] || []).reduce((s, e) => s + (e.caloriesBurned || 0), 0);
  const tdeeTarget   = loadTDEE(activeUser.username);

  // Workout streak (consecutive days with workouts)
  const workoutStreak = (() => {
    const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const days = new Set(Object.keys(workouts).filter((d) => (workouts[d] || []).length > 0));
    const start = days.has(today) ? today : days.has(yest) ? yest : null;
    if (!start) return 0;
    let s = 1;
    const cur = new Date(start + "T00:00:00");
    cur.setDate(cur.getDate() - 1);
    while (days.has(cur.toISOString().slice(0, 10))) { s++; cur.setDate(cur.getDate() - 1); }
    return s;
  })();

  // Net deficit for today: tdee + burn - intake (positive = deficit)
  const todayNetDeficit =
    tdeeTarget != null && todayIntake != null
      ? (tdeeTarget + todayBurn) - todayIntake
      : null;

  return (
    <div className="page" style={{ position: "relative", overflowX: "hidden" }}>

      {/* Subtle monochrome fitness illustration tiled behind content */}
      <FitnessBackground />
      {/* Gradient overlay softens the top/bottom edges of the illustration */}
      <div className="fitness-gradient-overlay" />

      {/* All page content sits above the illustration (z-index: 2) */}
      <div style={{ position: "relative", zIndex: 2 }}>

      {/* ── Hero — animated gradient ── */}
      <div className="hero-card">
        <p className="hero-headline">Track. Improve. Repeat.</p>
        <p className="hero-sub">Your nutrition and fitness journey in one place.</p>
        <div className="hero-badges">
          <span className="hero-badge">🥗 Diet</span>
          <span className="hero-badge">🏋️ Workouts</span>
          <span className="hero-badge">📈 Progress</span>
        </div>
      </div>

      {/* ── Today at a Glance ── */}
      {(todayIntake != null || todayBurn > 0 || workoutStreak > 0) && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {todayIntake != null && (
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderTop: "3px solid var(--accent)", borderRadius: 10, padding: "14px 16px", boxShadow: "var(--shadow-sm)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Today's Intake</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>{todayIntake.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                {tdeeTarget ? `kcal · target ${tdeeTarget.toLocaleString()}` : "kcal today"}
              </div>
            </div>
          )}

          {todayBurn > 0 && (
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderTop: "3px solid #f59e0b", borderRadius: 10, padding: "14px 16px", boxShadow: "var(--shadow-sm)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Today's Burn 🔥</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#f59e0b", lineHeight: 1 }}>{todayBurn.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>kcal from workouts</div>
            </div>
          )}

          {todayNetDeficit != null && (
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderTop: `3px solid ${todayNetDeficit >= 200 ? "#22c55e" : todayNetDeficit < 0 ? "#818cf8" : "var(--accent)"}`, borderRadius: 10, padding: "14px 16px", boxShadow: "var(--shadow-sm)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
                Net {todayNetDeficit >= 0 ? "Deficit" : "Surplus"}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: todayNetDeficit >= 200 ? "#22c55e" : todayNetDeficit < 0 ? "#818cf8" : "var(--text-primary)", lineHeight: 1 }}>
                {Math.abs(todayNetDeficit).toLocaleString()}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>kcal · diet + exercise</div>
            </div>
          )}

          {workoutStreak > 0 && (
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderTop: "3px solid #a855f7", borderRadius: 10, padding: "14px 16px", boxShadow: "var(--shadow-sm)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Workout Streak</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#a855f7", lineHeight: 1 }}>{workoutStreak}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                consecutive day{workoutStreak !== 1 ? "s" : ""}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className="stat-cards">

        {/* Weight card — with progress ring */}
        <div className="stat-card" style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <WeightProgressRing
            startWeight={startWeight}
            currentWeight={latestWeight}
            goalWeight={goalWeight}
            size={96}
          />
          <div>
            <div className="stat-label">Weight</div>
            <div className="stat-value">{latestWeight ?? "—"}</div>
            <div className="stat-sub">
              {latestWeight ? "kg · latest" : "No weight logged yet"}
            </div>
            {startWeight != null && latestWeight != null && startWeight !== latestWeight && (
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                Started: {startWeight} kg
              </div>
            )}
            {goalWeight && (
              <div style={{ fontSize: 11, color: "var(--accent)", marginTop: 2 }}>
                Goal: {goalWeight} kg
              </div>
            )}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-label">Weekly Avg Calories</div>
          <div className="stat-value">{avgCal ?? "—"}</div>
          <div className="stat-sub">
            {avgCal != null ? "kcal · last 7 entries" : "Log entries to see avg"}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🗓️</div>
          <div className="stat-label">Log Streak</div>
          <div className="stat-value">{logs.length > 0 ? streak : "—"}</div>
          <div className="stat-sub">
            {logs.length > 0
              ? `consecutive day${streak !== 1 ? "s" : ""}`
              : "Start logging to build a streak"}
          </div>
        </div>
      </div>

      {/* ── Weight chart ── */}
      {logs.length > 0 && (
        <div className="card">
          <h3 className="card-title">Weight Progress</h3>
          <WeightChart logs={logs} />
        </div>
      )}

      {/* ── Summary ── */}
      {logs.length > 0 && (
        <div className="card">
          <SummaryCards logs={logs} />
        </div>
      )}

      {/* ── Empty state ── */}
      {logs.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "52px 24px" }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>📝</div>
          <h3 style={{ color: "var(--text-primary)", margin: "0 0 8px", fontSize: 18 }}>
            No logs yet, {firstName}!
          </h3>
          <p style={{ color: "var(--text-secondary)", margin: 0 }}>
            Head to the <strong>Logs</strong> page to add your first entry.
          </p>
        </div>
      )}

      </div>{/* end z-index:2 wrapper */}
    </div>
  );
}
