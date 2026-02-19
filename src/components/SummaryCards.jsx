function Card({ label, value }) {
  return (
    <div
      style={{
        background: "var(--accent-light)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "12px 18px",
        minWidth: 130,
        flex: "1 1 130px",
      }}
    >
      <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>{value}</div>
    </div>
  );
}

export default function SummaryCards({ logs }) {
  if (logs.length === 0) return null;

  // Sort by date ascending
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));

  // Weight stats — only from entries that have weight
  const withWeight = sorted.filter((l) => l.morningWeightKg != null);
  const startWeight = withWeight.length > 0 ? withWeight[0].morningWeightKg : null;
  const latestWeight = withWeight.length > 0 ? withWeight[withWeight.length - 1].morningWeightKg : null;
  let changeDisplay = "—";
  if (startWeight != null && latestWeight != null) {
    const totalChange = parseFloat((latestWeight - startWeight).toFixed(1));
    const sign = totalChange > 0 ? "+" : "";
    const color = totalChange < 0 ? "#2e7d32" : totalChange > 0 ? "#c62828" : "var(--text-secondary)";
    changeDisplay = (
      <span style={{ color }}>
        {sign}{totalChange} kg
      </span>
    );
  }

  // Averages over last 7 entries (by date)
  const last7 = sorted.slice(-7);

  function avg(arr, key) {
    const vals = arr.map((l) => l[key]).filter((v) => v != null);
    if (vals.length === 0) return null;
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  }

  const avgCalories = avg(last7, "calories");
  const avgProtein = avg(last7, "proteinG");
  const avgSteps = avg(last7, "steps");

  return (
    <div>
      <h2 style={{ margin: "0 0 10px", color: "var(--text-primary)", fontSize: 15, fontWeight: 600 }}>Summary</h2>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Card
          label="Starting Weight"
          value={startWeight != null ? `${startWeight} kg` : "—"}
        />
        <Card
          label="Latest Weight"
          value={latestWeight != null ? `${latestWeight} kg` : "—"}
        />
        <div
          style={{
            background: "var(--accent-light)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "12px 18px",
            minWidth: 130,
            flex: "1 1 130px",
          }}
        >
          <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Total Change
          </div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{changeDisplay}</div>
        </div>
        <Card
          label="Avg Calories (7d)"
          value={avgCalories != null ? `${avgCalories} kcal` : "—"}
        />
        <Card
          label="Avg Protein (7d)"
          value={avgProtein != null ? `${avgProtein} g` : "—"}
        />
        <Card
          label="Avg Steps (7d)"
          value={
            avgSteps != null
              ? Number(avgSteps).toLocaleString()
              : "—"
          }
        />
      </div>
    </div>
  );
}
