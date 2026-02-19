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

// Computes a 7-day rolling average for each entry.
// At position i, it averages the weight values from entries [i-6 .. i] (up to 7 entries).
function addRollingAverage(sorted) {
  return sorted.map((entry, index) => {
    const window = sorted.slice(Math.max(0, index - 6), index + 1);
    const vals = window.map((e) => e.morningWeightKg).filter((v) => v != null);
    const avg =
      vals.length > 0
        ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2))
        : null;
    return { ...entry, rollingAvg: avg };
  });
}

export default function WeightChart({ logs }) {
  // Only include entries with a recorded weight, sorted by date
  const sorted = [...logs]
    .filter((l) => l.morningWeightKg != null)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length === 0) {
    return (
      <p style={{ color: "#888", fontStyle: "italic" }}>
        No weight data yet. Add a log with a weight value to see the chart.
      </p>
    );
  }

  const data = addRollingAverage(sorted);

  const weights = data.map((d) => d.morningWeightKg);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const padding = 0.5;

  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis
            domain={[min - padding, max + padding]}
            tick={{ fontSize: 11 }}
            width={45}
          />
          <Tooltip formatter={(value) => (value != null ? `${value} kg` : "—")} />
          <Legend />
          <Line
            type="monotone"
            dataKey="morningWeightKg"
            name="Weight (kg)"
            stroke="#8884d8"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            connectNulls={false}
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
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
