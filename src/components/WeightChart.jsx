import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useAccent } from "../context/AccentContext";

// Computes a 7-day rolling average for each entry.
function addRollingAverage(sorted) {
  return sorted.map((entry, index) => {
    const window = sorted.slice(Math.max(0, index - 6), index + 1);
    const vals   = window.map((e) => e.morningWeightKg).filter((v) => v != null);
    const avg    = vals.length > 0
      ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2))
      : null;
    return { ...entry, rollingAvg: avg };
  });
}

export default function WeightChart({ logs }) {
  const { primary: accentPrimary } = useAccent();

  const sorted = [...logs]
    .filter((l) => l.morningWeightKg != null)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length === 0) {
    return (
      <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
        No weight data yet. Add a log with a weight value to see the chart.
      </p>
    );
  }

  const data    = addRollingAverage(sorted);
  const weights = data.map((d) => d.morningWeightKg);
  const min     = Math.min(...weights);
  const max     = Math.max(...weights);

  return (
    // fade-up class triggers CSS entrance animation defined in index.css
    <div className="fade-up" style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
          />
          <YAxis
            domain={[min - 0.5, max + 0.5]}
            tick={{ fontSize: 11, fill: "var(--text-secondary)" }}
            width={45}
          />
          <Tooltip
            formatter={(value) => (value != null ? `${value} kg` : "—")}
            contentStyle={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--text-primary)",
              fontSize: 13,
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="morningWeightKg"
            name="Weight (kg)"
            stroke={accentPrimary}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            connectNulls={false}
            animationDuration={800}
            animationEasing="ease-out"
          />
          <Line
            type="monotone"
            dataKey="rollingAvg"
            name="7-Day Avg"
            stroke="#ff7300"
            strokeWidth={2}
            dot={false}
            strokeDasharray="5 5"
            connectNulls={true}
            animationDuration={1200}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
