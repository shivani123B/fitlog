import { useState, useEffect } from "react";
import { ThemeProvider }       from "./context/ThemeContext";
import { AccentProvider }      from "./context/AccentContext";
import MainLayout              from "./layouts/MainLayout";
import Dashboard               from "./pages/Dashboard";
import Logs                    from "./pages/Logs";
import Settings                from "./pages/Settings";
import CalorieIntelligence     from "./pages/CalorieIntelligence";
import Suggestions             from "./pages/Suggestions";
import Workouts                from "./pages/Workouts";
import UserPanel               from "./components/UserPanel";

// ── Storage keys ──────────────────────────────────────────────────────────────
const USERS_KEY        = "fitlog_users_v1";
const LOGS_BY_USER_KEY = "fitlog_logs_by_user_v1";
const ACTIVE_USER_KEY  = "fitlog_active_user_v1";
const WORKOUTS_KEY     = "fitlog_workouts_by_user_v1";

// ── Storage helpers ───────────────────────────────────────────────────────────
function loadUsers()          { try { return JSON.parse(localStorage.getItem(USERS_KEY))        || []; } catch { return []; } }
function loadAllLogs()        { try { return JSON.parse(localStorage.getItem(LOGS_BY_USER_KEY)) || {}; } catch { return {}; } }
function loadActiveUsername() { return localStorage.getItem(ACTIVE_USER_KEY) || null; }
function loadAllWorkouts()    { try { return JSON.parse(localStorage.getItem(WORKOUTS_KEY))     || {}; } catch { return {}; } }

function saveUsers(u)          { localStorage.setItem(USERS_KEY,        JSON.stringify(u)); }
function saveAllLogs(l)        { localStorage.setItem(LOGS_BY_USER_KEY, JSON.stringify(l)); }
function saveActiveUsername(u) {
  if (u) localStorage.setItem(ACTIVE_USER_KEY, u);
  else   localStorage.removeItem(ACTIVE_USER_KEY);
}
function saveAllWorkouts(w)    { localStorage.setItem(WORKOUTS_KEY, JSON.stringify(w)); }

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [users,          setUsers]          = useState(() => loadUsers());
  const [allLogs,        setAllLogs]        = useState(() => loadAllLogs());
  const [allWorkouts,    setAllWorkouts]    = useState(() => loadAllWorkouts());
  const [activeUsername, setActiveUsername] = useState(() => loadActiveUsername());
  const [editingLog,     setEditingLog]     = useState(null);
  const [page,           setPage]           = useState("dashboard");

  // Clear stale active username if the referenced user was deleted.
  useEffect(() => {
    if (activeUsername && !users.find((u) => u.username === activeUsername)) {
      setActiveUsername(null);
      saveActiveUsername(null);
    }
  }, [users, activeUsername]);

  const activeUser = users.find((u) => u.username === activeUsername) || null;
  const logs       = activeUser ? (allLogs[activeUsername]     || []) : [];
  // workouts: { "YYYY-MM-DD": [{ id, workoutName, category, durationMin, met, caloriesBurned }] }
  const workouts   = activeUser ? (allWorkouts[activeUsername] || {}) : {};

  // ── User handlers ──────────────────────────────────────────────────────────
  function handleCreateUser(newUser) {
    const updatedUsers   = [...users, newUser];
    const updatedAllLogs = { ...allLogs, [newUser.username]: [] };
    setUsers(updatedUsers);     saveUsers(updatedUsers);
    setAllLogs(updatedAllLogs); saveAllLogs(updatedAllLogs);
    setActiveUsername(newUser.username); saveActiveUsername(newUser.username);
    setEditingLog(null);
    setPage("dashboard");
  }

  function handleSelectUser(username) {
    setActiveUsername(username); saveActiveUsername(username);
    setEditingLog(null);
    setPage("dashboard");
  }

  function handleUpdateUser(updatedProfile) {
    const updatedUsers = users.map((u) =>
      u.username === activeUsername ? { ...u, profile: updatedProfile } : u
    );
    setUsers(updatedUsers);
    saveUsers(updatedUsers);
  }

  function handleSwitchUser() {
    setActiveUsername(null);
    saveActiveUsername(null);
    setEditingLog(null);
  }

  // ── Log handlers ───────────────────────────────────────────────────────────
  function handleSave(newLog) {
    const existing = logs.find((l) => l.date === newLog.date);
    if (existing && !editingLog) {
      if (!window.confirm(`A log for ${newLog.date} already exists. Overwrite it?`)) return;
    }
    const updated    = existing
      ? logs.map((l) => (l.date === newLog.date ? newLog : l))
      : [...logs, newLog];
    const newAllLogs = { ...allLogs, [activeUsername]: updated };
    setAllLogs(newAllLogs); saveAllLogs(newAllLogs);
    setEditingLog(null);
  }

  function handleEdit(log) {
    setEditingLog(log);
    setPage("logs");
  }

  function handleCancelEdit() { setEditingLog(null); }

  function handleDelete(date) {
    if (!window.confirm(`Delete the log for ${date}?`)) return;
    const updated    = logs.filter((l) => l.date !== date);
    const newAllLogs = { ...allLogs, [activeUsername]: updated };
    setAllLogs(newAllLogs); saveAllLogs(newAllLogs);
    if (editingLog?.date === date) setEditingLog(null);
  }

  // ── Workout handlers ────────────────────────────────────────────────────────

  // Add a single workout entry to the correct date bucket.
  function handleSaveWorkout(entry) {
    // entry: { id, date, workoutName, category, durationMin, met, caloriesBurned }
    const userWorkouts = allWorkouts[activeUsername] || {};
    const dayEntries   = userWorkouts[entry.date]   || [];
    const updated = {
      ...allWorkouts,
      [activeUsername]: {
        ...userWorkouts,
        [entry.date]: [...dayEntries, entry],
      },
    };
    setAllWorkouts(updated);
    saveAllWorkouts(updated);
  }

  // Remove a single workout entry by date + id.
  function handleDeleteWorkout(date, id) {
    const userWorkouts = { ...(allWorkouts[activeUsername] || {}) };
    const dayEntries   = (userWorkouts[date] || []).filter((e) => e.id !== id);
    if (dayEntries.length === 0) {
      delete userWorkouts[date]; // clean up empty date keys
    } else {
      userWorkouts[date] = dayEntries;
    }
    const updated = { ...allWorkouts, [activeUsername]: userWorkouts };
    setAllWorkouts(updated);
    saveAllWorkouts(updated);
  }

  function handleImportData({ logs: importedLogs, workouts: importedWorkouts, profile: importedProfile }) {
    const newAllLogs = { ...allLogs, [activeUsername]: importedLogs };
    setAllLogs(newAllLogs); saveAllLogs(newAllLogs);
    const newAllWorkouts = { ...allWorkouts, [activeUsername]: importedWorkouts };
    setAllWorkouts(newAllWorkouts); saveAllWorkouts(newAllWorkouts);
    if (importedProfile) {
      const updatedUsers = users.map((u) =>
        u.username === activeUsername ? { ...u, profile: importedProfile } : u
      );
      setUsers(updatedUsers); saveUsers(updatedUsers);
    }
  }

  // ── Pre-login screen ───────────────────────────────────────────────────────
  if (!activeUser) {
    return (
      <ThemeProvider>
        {/* AccentProvider with no activeUser → keeps default indigo accent */}
        <AccentProvider activeUser={null}>
          <div className="login-screen">
            <div className="login-container">
              <div className="login-brand">
                <div className="login-brand-name">🏋️ FitLog</div>
                <div className="login-brand-sub">Diet · Macros · Weight · Steps</div>
              </div>
              <UserPanel
                users={users}
                activeUsername={activeUsername}
                onCreateUser={handleCreateUser}
                onSelectUser={handleSelectUser}
              />
            </div>
          </div>
        </AccentProvider>
      </ThemeProvider>
    );
  }

  // ── Logged-in layout ───────────────────────────────────────────────────────
  function renderPage() {
    switch (page) {
      case "dashboard":
        return <Dashboard logs={logs} activeUser={activeUser} workouts={workouts} />;
      case "logs":
        return (
          <Logs
            logs={logs}
            editingLog={editingLog}
            onSave={handleSave}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCancel={handleCancelEdit}
          />
        );
      case "calorie-intelligence":
        return (
          <CalorieIntelligence
            logs={logs}
            activeUser={activeUser}
            onUpdateUser={handleUpdateUser}
            workouts={workouts}
          />
        );
      case "suggestions":
        return (
          <Suggestions
            logs={logs}
            activeUser={activeUser}
            workouts={workouts}
            onSaveLog={handleSave}
          />
        );
      case "workouts":
        return (
          <Workouts
            workouts={workouts}
            activeUser={activeUser}
            onSaveWorkout={handleSaveWorkout}
            onDeleteWorkout={handleDeleteWorkout}
          />
        );
      case "settings":
        return (
          <Settings
            activeUser={activeUser}
            onUpdateUser={handleUpdateUser}
            onSwitchUser={handleSwitchUser}
            logs={logs}
            workouts={workouts}
            onImportData={handleImportData}
          />
        );
      default:
        return <Dashboard logs={logs} activeUser={activeUser} />;
    }
  }

  return (
    <ThemeProvider>
      {/* AccentProvider reads activeUser.profile.gender and sets CSS vars on
          <body> so accent colors cascade to all children automatically. */}
      <AccentProvider activeUser={activeUser}>
        <MainLayout page={page} setPage={setPage} activeUser={activeUser}>
          {renderPage()}
        </MainLayout>
      </AccentProvider>
    </ThemeProvider>
  );
}
