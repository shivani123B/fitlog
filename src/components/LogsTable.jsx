import { useState } from "react";
import LogDetailsModal from "./LogDetailsModal";

// Returns a compact "B:n L:n D:n S:n" string, or "—" if no meals data.
function mealSummary(log) {
  const m = log.meals;
  if (!m) return "—";
  const b = m.breakfast?.items?.length ?? 0;
  const l = m.lunch?.items?.length ?? 0;
  const d = m.dinner?.items?.length ?? 0;
  const s = m.snacks?.items?.length ?? 0;
  if (b + l + d + s === 0) return "—";
  return `B:${b} L:${l} D:${d} S:${s}`;
}

export default function LogsTable({ logs, sortOrder, onToggleSort, onEdit, onDelete }) {
  // The log currently shown in the details modal (null = modal closed)
  const [viewingLog, setViewingLog] = useState(null);

  const sorted = [...logs].sort((a, b) => {
    if (sortOrder === "newest") return b.date.localeCompare(a.date);
    return a.date.localeCompare(b.date);
  });

  const th = {
    padding: "10px 10px",
    background: "#e9ecef",
    fontWeight: 600,
    fontSize: 13,
    textAlign: "left",
    borderBottom: "2px solid #dee2e6",
    whiteSpace: "nowrap",
  };

  const td = {
    padding: "8px 10px",
    fontSize: 14,
    borderBottom: "1px solid #eee",
    verticalAlign: "middle",
  };

  if (logs.length === 0) {
    return (
      <div>
        <h2 style={{ margin: "0 0 10px" }}>Logs</h2>
        <p style={{ color: "#888" }}>No logs yet. Add your first entry above.</p>
      </div>
    );
  }

  return (
    <div>
      {/* ── Table header row ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <h2 style={{ margin: 0 }}>Logs ({logs.length})</h2>
        <button
          onClick={onToggleSort}
          style={{
            padding: "6px 12px",
            fontSize: 13,
            border: "1px solid #ccc",
            borderRadius: 6,
            cursor: "pointer",
            background: "white",
          }}
        >
          {sortOrder === "newest" ? "Newest first ↓" : "Oldest first ↑"}
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 750 }}>
          <thead>
            <tr>
              <th style={th}>Date</th>
              <th style={th}>Weight (kg)</th>
              <th style={th}>Calories</th>
              <th style={th}>Protein (g)</th>
              <th style={th}>Carbs (g)</th>
              <th style={th}>Fat (g)</th>
              <th style={th}>Fiber (g)</th>
              <th style={th}>Steps</th>
              <th style={th}>Meals</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((log, i) => (
              <tr key={log.date} style={{ background: i % 2 === 0 ? "white" : "#fafafa" }}>
                <td style={{ ...td, fontWeight: 500 }}>{log.date}</td>
                <td style={td}>{log.morningWeightKg ?? "—"}</td>
                <td style={td}>{log.calories ?? "—"}</td>
                <td style={td}>{log.proteinG ?? "—"}</td>
                <td style={td}>{log.carbsG ?? "—"}</td>
                <td style={td}>{log.fatG ?? "—"}</td>
                <td style={td}>{log.fiberG ?? "—"}</td>
                <td style={td}>{log.steps != null ? log.steps.toLocaleString() : "—"}</td>

                {/* Compact meal item counts */}
                <td
                  style={{
                    ...td,
                    fontFamily: "monospace",
                    fontSize: 12,
                    color: mealSummary(log) === "—" ? "#bbb" : "#333",
                  }}
                >
                  {mealSummary(log)}
                </td>

                {/* Action buttons */}
                <td style={{ ...td, whiteSpace: "nowrap" }}>
                  <button
                    onClick={() => setViewingLog(log)}
                    style={{
                      marginRight: 4,
                      padding: "4px 9px",
                      fontSize: 12,
                      background: "#607d8b",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                    }}
                  >
                    View
                  </button>
                  <button
                    onClick={() => onEdit(log)}
                    style={{
                      marginRight: 4,
                      padding: "4px 10px",
                      fontSize: 12,
                      background: "#2196F3",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(log.date)}
                    style={{
                      padding: "4px 10px",
                      fontSize: 12,
                      background: "#f44336",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Details modal — rendered outside the table so it overlays everything */}
      <LogDetailsModal
        log={viewingLog}
        onClose={() => setViewingLog(null)}
      />
    </div>
  );
}
