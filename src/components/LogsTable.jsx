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
    background: "var(--bg-secondary)",
    fontWeight: 600,
    fontSize: 13,
    textAlign: "left",
    borderBottom: "2px solid var(--border)",
    color: "var(--text-secondary)",
    whiteSpace: "nowrap",
  };

  const td = {
    padding: "8px 10px",
    fontSize: 14,
    borderBottom: "1px solid var(--border)",
    verticalAlign: "middle",
    color: "var(--text-primary)",
  };

  if (logs.length === 0) {
    return (
      <div>
        <h2 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>Logs</h2>
        <p style={{ color: "var(--text-muted)" }}>No logs yet. Add your first entry above.</p>
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
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
          Logs ({logs.length})
        </h2>
        <button
          onClick={onToggleSort}
          className="btn-secondary"
          style={{ fontSize: 13 }}
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
              <tr
                key={log.date}
                style={{ background: i % 2 === 0 ? "var(--bg-card)" : "var(--bg-secondary)" }}
              >
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
                    color: mealSummary(log) === "—" ? "var(--text-muted)" : "var(--text-primary)",
                  }}
                >
                  {mealSummary(log)}
                </td>

                {/* Action buttons */}
                <td style={{ ...td, whiteSpace: "nowrap" }}>
                  <button
                    onClick={() => setViewingLog(log)}
                    className="btn-secondary"
                    style={{ marginRight: 4, padding: "4px 9px", fontSize: 12 }}
                  >
                    View
                  </button>
                  <button
                    onClick={() => onEdit(log)}
                    className="btn-primary"
                    style={{ marginRight: 4, padding: "4px 10px", fontSize: 12 }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(log.date)}
                    className="btn-danger"
                    style={{ padding: "4px 10px", fontSize: 12 }}
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
