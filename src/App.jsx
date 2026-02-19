import { useState, useEffect } from "react";
import UserPanel from "./components/UserPanel";
import LogForm from "./components/LogForm";
import LogsTable from "./components/LogsTable";
import SummaryCards from "./components/SummaryCards";
import WeightChart from "./components/WeightChart";

// ── Storage keys ──────────────────────────────────────────────────────────────
const USERS_KEY        = "fitlog_users_v1";
const LOGS_BY_USER_KEY = "fitlog_logs_by_user_v1";
const ACTIVE_USER_KEY  = "fitlog_active_user_v1";

// ── Storage helpers ───────────────────────────────────────────────────────────
function loadUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
  catch { return []; }
}
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function loadAllLogs() {
  try { return JSON.parse(localStorage.getItem(LOGS_BY_USER_KEY)) || {}; }
  catch { return {}; }
}
function saveAllLogs(allLogs) {
  localStorage.setItem(LOGS_BY_USER_KEY, JSON.stringify(allLogs));
}

function loadActiveUsername() {
  return localStorage.getItem(ACTIVE_USER_KEY) || null;
}
function saveActiveUsername(username) {
  if (username) localStorage.setItem(ACTIVE_USER_KEY, username);
  else          localStorage.removeItem(ACTIVE_USER_KEY);
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [users,          setUsers]          = useState(() => loadUsers());
  const [allLogs,        setAllLogs]        = useState(() => loadAllLogs());
  const [activeUsername, setActiveUsername] = useState(() => loadActiveUsername());
  const [editingLog,     setEditingLog]     = useState(null);
  const [sortOrder,      setSortOrder]      = useState("newest");

  // If the stored active username no longer exists in the users array, clear it.
  useEffect(() => {
    if (activeUsername && !users.find((u) => u.username === activeUsername)) {
      setActiveUsername(null);
      saveActiveUsername(null);
    }
  }, [users, activeUsername]);

  // Logs for the active user (empty array when no user is selected)
  const logs = activeUsername ? (allLogs[activeUsername] || []) : [];

  // ── User handlers ────────────────────────────────────────────────────────
  function handleCreateUser(newUser) {
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    saveUsers(updatedUsers);

    // Initialize an empty log list for the new user
    const updatedAllLogs = { ...allLogs, [newUser.username]: [] };
    setAllLogs(updatedAllLogs);
    saveAllLogs(updatedAllLogs);

    // Auto-switch to the newly created user
    setActiveUsername(newUser.username);
    saveActiveUsername(newUser.username);
    setEditingLog(null);
  }

  function handleSelectUser(username) {
    setActiveUsername(username);
    saveActiveUsername(username);
    setEditingLog(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Log handlers (all scoped to activeUsername) ──────────────────────────
  function handleSave(newLog) {
    const existing = logs.find((l) => l.date === newLog.date);

    if (existing && !editingLog) {
      if (!window.confirm(`A log for ${newLog.date} already exists. Overwrite it?`)) return;
    }

    const updated = existing
      ? logs.map((l) => (l.date === newLog.date ? newLog : l))
      : [...logs, newLog];

    const newAllLogs = { ...allLogs, [activeUsername]: updated };
    setAllLogs(newAllLogs);
    saveAllLogs(newAllLogs);
    setEditingLog(null);
  }

  function handleEdit(log) {
    setEditingLog(log);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelEdit() {
    setEditingLog(null);
  }

  function handleDelete(date) {
    if (!window.confirm(`Delete the log for ${date}?`)) return;
    const updated = logs.filter((l) => l.date !== date);
    const newAllLogs = { ...allLogs, [activeUsername]: updated };
    setAllLogs(newAllLogs);
    saveAllLogs(newAllLogs);
    if (editingLog?.date === date) setEditingLog(null);
  }

  function handleReset() {
    if (!window.confirm(`Delete ALL logs for "${activeUsername}"? This cannot be undone.`)) return;
    const newAllLogs = { ...allLogs, [activeUsername]: [] };
    setAllLogs(newAllLogs);
    saveAllLogs(newAllLogs);
    setEditingLog(null);
  }

  function toggleSortOrder() {
    setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"));
  }

  const hasActiveUser = !!activeUsername;

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "24px 16px",
        fontFamily: "system-ui, Arial, sans-serif",
        color: "#1a1a1a",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 28, color: "#1a1a2e" }}>FitLog</h1>
          <p style={{ margin: "4px 0 0", color: "#666", fontSize: 14 }}>
            Diet · Macros · Weight · Steps tracker
          </p>
        </div>

        {/* Reset is only visible when a user is active */}
        {hasActiveUser && (
          <button
            onClick={handleReset}
            style={{
              padding: "8px 14px",
              background: "white",
              color: "#c62828",
              border: "1px solid #c62828",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Reset data
          </button>
        )}
      </div>

      <hr style={{ margin: "16px 0", borderColor: "#eee" }} />

      {/* ── User panel (always visible) ── */}
      <UserPanel
        users={users}
        activeUsername={activeUsername}
        onCreateUser={handleCreateUser}
        onSelectUser={handleSelectUser}
      />

      {/* ── Guard: require an active user ── */}
      {!hasActiveUser ? (
        <div
          style={{
            margin: "40px 0",
            textAlign: "center",
            color: "#999",
            fontSize: 15,
          }}
        >
          Select or create a user to start logging.
        </div>
      ) : (
        <>
          <hr style={{ margin: "24px 0", borderColor: "#eee" }} />

          {/* Log form */}
          <LogForm
            editingLog={editingLog}
            onSave={handleSave}
            onCancel={handleCancelEdit}
          />

          <hr style={{ margin: "28px 0", borderColor: "#eee" }} />

          {/* Summary cards */}
          <SummaryCards logs={logs} />

          <hr style={{ margin: "28px 0", borderColor: "#eee" }} />

          {/* Weight chart */}
          <h2 style={{ margin: "0 0 12px" }}>Weight Progress</h2>
          <WeightChart logs={logs} />

          <hr style={{ margin: "28px 0", borderColor: "#eee" }} />

          {/* Logs table */}
          <LogsTable
            logs={logs}
            sortOrder={sortOrder}
            onToggleSort={toggleSortOrder}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </>
      )}
    </div>
  );
}
