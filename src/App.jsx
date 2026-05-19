import { useState, useEffect, useCallback } from "react";
import { ThemeProvider }       from "./context/ThemeContext";
import { AccentProvider }      from "./context/AccentContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import MainLayout              from "./layouts/MainLayout";
import Dashboard               from "./pages/Dashboard";
import Logs                    from "./pages/Logs";
import Settings                from "./pages/Settings";
import CalorieIntelligence     from "./pages/CalorieIntelligence";
import Suggestions             from "./pages/Suggestions";
import Workouts                from "./pages/Workouts";
import UserPanel               from "./components/UserPanel";
import * as api                from "./utils/api";

function normalizeLog(l) {
  return {
    date:            l.date,
    morningWeightKg: l.morning_weight_kg ?? l.morningWeightKg ?? null,
    calories:        l.calories ?? null,
    proteinG:        l.protein_g ?? l.proteinG ?? null,
    carbsG:          l.carbs_g ?? l.carbsG ?? null,
    fatG:            l.fat_g ?? l.fatG ?? null,
    fiberG:          l.fiber_g ?? l.fiberG ?? null,
    steps:           l.steps ?? null,
    meals:           l.meals || null,
    notes:           l.notes || "",
  };
}

function normalizeWorkout(w) {
  return {
    id:             w.id,
    date:           w.date,
    workoutName:    w.workout_name ?? w.workoutName,
    category:       w.category,
    durationMin:    w.duration_min ?? w.durationMin,
    met:            w.met,
    caloriesBurned: w.calories_burned ?? w.caloriesBurned,
  };
}

function AppInner() {
  const { currentUser, loading, register, login, logout, refreshProfile } = useAuth();

  const [logs,        setLogs]        = useState([]);
  const [workouts,    setWorkouts]    = useState({});
  const [editingLog,  setEditingLog]  = useState(null);
  const [page,        setPage]        = useState("dashboard");
  const [dataLoading, setDataLoading] = useState(false);

  const activeUser = currentUser
    ? {
        ...currentUser,
        username: currentUser.username,
        profile: currentUser.profile,
      }
    : null;

  const fetchData = useCallback(async () => {
    if (!currentUser) return;
    setDataLoading(true);
    try {
      const [logsData, workoutsData] = await Promise.all([
        api.logs.list("desc", 1000),
        api.workouts.list(),
      ]);
      setLogs(logsData.map(normalizeLog));

      const grouped = {};
      for (const w of workoutsData) {
        const nw = normalizeWorkout(w);
        if (!grouped[nw.date]) grouped[nw.date] = [];
        grouped[nw.date].push(nw);
      }
      setWorkouts(grouped);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setDataLoading(false);
    }
  }, [currentUser]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleUpdateUser(updatedProfile) {
    try {
      await api.users.update({
        name:                     updatedProfile.name,
        age:                      updatedProfile.age,
        height_cm:                updatedProfile.heightCm,
        weight_kg:                updatedProfile.weightKg,
        gender:                   updatedProfile.gender,
        diet_category:            updatedProfile.dietCategory,
        goal_weight_kg:           updatedProfile.goalWeightKg,
        weekly_active_minutes_goal: updatedProfile.weeklyActiveMinutesGoal,
        preferred_deficit:        updatedProfile.preferredDeficit,
      });
      await refreshProfile();
    } catch (err) {
      console.error("Failed to update profile:", err);
    }
  }

  function handleSwitchUser() {
    logout();
    setLogs([]);
    setWorkouts({});
    setEditingLog(null);
  }

  async function handleSave(newLog) {
    const existing = logs.find((l) => l.date === newLog.date);
    if (existing && !editingLog) {
      if (!window.confirm(`A log for ${newLog.date} already exists. Overwrite it?`)) return;
    }

    const body = {
      date:              newLog.date,
      morning_weight_kg: newLog.morningWeightKg ?? null,
      calories:          newLog.calories ?? null,
      protein_g:         newLog.proteinG ?? null,
      carbs_g:           newLog.carbsG ?? null,
      fat_g:             newLog.fatG ?? null,
      fiber_g:           newLog.fiberG ?? null,
      steps:             newLog.steps ?? null,
      meals:             newLog.meals || { breakfast: { time: "", items: [] }, lunch: { time: "", items: [] }, dinner: { time: "", items: [] }, snacks: { time: "", items: [] } },
      notes:             newLog.notes || "",
    };

    try {
      if (existing) {
        const updated = normalizeLog(await api.logs.update(newLog.date, body));
        setLogs(logs.map((l) => (l.date === newLog.date ? updated : l)));
      } else {
        const created = normalizeLog(await api.logs.create(body));
        setLogs([created, ...logs]);
      }
      setEditingLog(null);
    } catch (err) {
      if (err.status === 409) {
        if (window.confirm(`A log for ${newLog.date} already exists on the server. Overwrite it?`)) {
          const updated = normalizeLog(await api.logs.update(newLog.date, body));
          setLogs(logs.map((l) => (l.date === newLog.date ? updated : l)));
          setEditingLog(null);
        }
      } else {
        alert("Failed to save log: " + err.message);
      }
    }
  }

  function handleEdit(log) {
    setEditingLog(log);
    setPage("logs");
  }

  function handleCancelEdit() { setEditingLog(null); }

  async function handleDelete(date) {
    if (!window.confirm(`Delete the log for ${date}?`)) return;
    try {
      await api.logs.delete(date);
      setLogs(logs.filter((l) => l.date !== date));
      if (editingLog?.date === date) setEditingLog(null);
    } catch (err) {
      alert("Failed to delete log: " + err.message);
    }
  }

  async function handleSaveWorkout(entry) {
    const body = {
      date:            entry.date,
      workout_name:    entry.workoutName,
      category:        entry.category,
      duration_min:    entry.durationMin,
      met:             entry.met,
      calories_burned: entry.caloriesBurned,
    };
    try {
      const created = normalizeWorkout(await api.workouts.create(body));
      setWorkouts((prev) => {
        const day = prev[entry.date] || [];
        return { ...prev, [entry.date]: [...day, created] };
      });
    } catch (err) {
      alert("Failed to save workout: " + err.message);
    }
  }

  async function handleDeleteWorkout(date, id) {
    try {
      await api.workouts.delete(id);
      setWorkouts((prev) => {
        const day = (prev[date] || []).filter((e) => e.id !== id);
        const updated = { ...prev };
        if (day.length === 0) delete updated[date];
        else updated[date] = day;
        return updated;
      });
    } catch (err) {
      alert("Failed to delete workout: " + err.message);
    }
  }

  async function handleImportData({ logs: importedLogs, workouts: importedWorkouts, profile: importedProfile }) {
    try {
      const logBodies = (importedLogs || []).map((l) => ({
        date:              l.date,
        morning_weight_kg: l.morningWeightKg ?? null,
        calories:          l.calories ?? null,
        protein_g:         l.proteinG ?? null,
        carbs_g:           l.carbsG ?? null,
        fat_g:             l.fatG ?? null,
        fiber_g:           l.fiberG ?? null,
        steps:             l.steps ?? null,
        meals:             l.meals || { breakfast: { time: "", items: [] }, lunch: { time: "", items: [] }, dinner: { time: "", items: [] }, snacks: { time: "", items: [] } },
        notes:             l.notes || "",
      }));

      const flatWorkouts = [];
      if (importedWorkouts && typeof importedWorkouts === "object") {
        for (const [date, entries] of Object.entries(importedWorkouts)) {
          for (const w of entries) {
            flatWorkouts.push({
              date:            date,
              workout_name:    w.workoutName || w.workout_name,
              category:        w.category,
              duration_min:    w.durationMin || w.duration_min,
              met:             w.met,
              calories_burned: w.caloriesBurned || w.calories_burned,
            });
          }
        }
      }

      await api.data.importAll({ version: 1, logs: logBodies, workouts: flatWorkouts });
      if (importedProfile) await handleUpdateUser(importedProfile);
      await fetchData();
    } catch (err) {
      alert("Import failed: " + err.message);
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
      </div>
    );
  }

  if (!activeUser) {
    return (
      <AccentProvider activeUser={null}>
        <div className="login-screen">
          <div className="login-container">
            <div className="login-brand">
              <div className="login-brand-name">🏋️ FitLog</div>
              <div className="login-brand-sub">Diet · Macros · Weight · Steps</div>
            </div>
            <UserPanel onRegister={register} onLogin={login} />
          </div>
        </div>
      </AccentProvider>
    );
  }

  function renderPage() {
    if (dataLoading && logs.length === 0) {
      return <div style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>Loading data...</div>;
    }
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
        return <Dashboard logs={logs} activeUser={activeUser} workouts={workouts} />;
    }
  }

  return (
    <AccentProvider activeUser={activeUser}>
      <MainLayout page={page} setPage={setPage} activeUser={activeUser}>
        {renderPage()}
      </MainLayout>
    </AccentProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </ThemeProvider>
  );
}
