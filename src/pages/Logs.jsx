import { useState } from "react";
import LogForm      from "../components/LogForm";
import LogsTable    from "../components/LogsTable";
import SummaryCards from "../components/SummaryCards";

export default function Logs({ logs, editingLog, onSave, onEdit, onDelete, onCancel }) {
  const [sortOrder, setSortOrder] = useState("newest");

  return (
    <div className="page">
      <h1 className="page-title">Logs</h1>

      {/* Add / edit form */}
      <div className="card">
        <LogForm editingLog={editingLog} onSave={onSave} onCancel={onCancel} />
      </div>

      {/* Summary strip */}
      {logs.length > 0 && (
        <div className="card">
          <SummaryCards logs={logs} />
        </div>
      )}

      {/* Logs table */}
      <div className="card">
        <LogsTable
          logs={logs}
          sortOrder={sortOrder}
          onToggleSort={() => setSortOrder((p) => (p === "newest" ? "oldest" : "newest"))}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}
