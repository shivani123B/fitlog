import { useState, useRef } from "react";
import { useTheme } from "../context/ThemeContext";

function ToggleSwitch({ checked, onChange }) {
  return (
    <label className="toggle-switch">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="toggle-track" />
    </label>
  );
}

const inp = {
  padding: "8px 10px",
  border: "1px solid var(--border)",
  borderRadius: 6,
  fontSize: 14,
  background: "var(--bg-input)",
  color: "var(--text-primary)",
  width: "100%",
  boxSizing: "border-box",
};

export default function Settings({ activeUser, onUpdateUser, onSwitchUser, logs = [], workouts = {}, onImportData }) {
  const { theme, toggleTheme } = useTheme();
  const importRef = useRef(null);

  // ── Global auto-fill preference ──────────────────────────────────────────
  const [autoFillDefault, setAutoFillDefault] = useState(
    () => localStorage.getItem("fitlog_autofill_default") !== "false"
  );
  function handleAutoFillToggle() {
    const next = !autoFillDefault;
    setAutoFillDefault(next);
    localStorage.setItem("fitlog_autofill_default", String(next));
  }

  // ── Profile editing ──────────────────────────────────────────────────────
  const profile = activeUser.profile || {};
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name:         profile.name         || "",
    age:          profile.age          || "",
    heightCm:     profile.heightCm     || "",
    weightKg:     profile.weightKg     || "",
    gender:       profile.gender       || "",
    dietCategory: profile.dietCategory || "",
  });

  function handleProfileChange(e) {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  }

  function handleProfileSave(e) {
    e.preventDefault();
    onUpdateUser({
      ...profile,
      name:         profileForm.name.trim(),
      age:          Number(profileForm.age),
      heightCm:     profileForm.heightCm !== "" ? Number(profileForm.heightCm) : null,
      weightKg:     profileForm.weightKg !== "" ? Number(profileForm.weightKg) : null,
      gender:       profileForm.gender,
      dietCategory: profileForm.dietCategory || null,
    });
    setEditingProfile(false);
  }

  // ── Goal settings ────────────────────────────────────────────────────────
  const [editingGoals, setEditingGoals] = useState(false);
  const [goalForm, setGoalForm] = useState({
    weeklyActiveMinutesGoal: profile.weeklyActiveMinutesGoal ?? 150,
    preferredDeficit:        profile.preferredDeficit        ?? 500,
  });
  const [goalSaved, setGoalSaved] = useState(false);

  function handleGoalChange(e) {
    setGoalForm({ ...goalForm, [e.target.name]: e.target.value });
  }

  function handleGoalSave(e) {
    e.preventDefault();
    onUpdateUser({
      ...profile,
      weeklyActiveMinutesGoal: Number(goalForm.weeklyActiveMinutesGoal) || 150,
      preferredDeficit:        Number(goalForm.preferredDeficit)        || 500,
    });
    setGoalSaved(true);
    setTimeout(() => setGoalSaved(false), 2500);
    setEditingGoals(false);
  }

  // ── Export data ──────────────────────────────────────────────────────────
  function handleExport() {
    const data = {
      version:    1,
      exportedAt: new Date().toISOString(),
      user:       activeUser,
      logs,
      workouts,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `fitlog_${activeUser.username}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Import data ──────────────────────────────────────────────────────────
  const [importMsg, setImportMsg] = useState(null);

  function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    // Reset input so same file can be re-selected
    e.target.value = "";

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.user || !Array.isArray(data.logs) || typeof data.workouts !== "object") {
          setImportMsg({ type: "error", text: "Invalid FitLog export file." });
          return;
        }
        if (!window.confirm(
          `Import data for user "${data.user.username}"?\n\nThis will overwrite their current logs and workouts. Profile will also be updated.`
        )) return;

        if (onImportData) {
          onImportData({
            logs:     data.logs     || [],
            workouts: data.workouts || {},
            profile:  data.user?.profile || null,
          });
        }
        setImportMsg({ type: "success", text: "Data imported successfully." });
        setTimeout(() => setImportMsg(null), 4000);
      } catch {
        setImportMsg({ type: "error", text: "Could not read the file. Make sure it is a valid FitLog export." });
      }
    };
    reader.readAsText(file);
  }

  // ── Danger zone ──────────────────────────────────────────────────────────
  function handleResetAll() {
    if (!window.confirm(
      "This will permanently delete ALL users and ALL logs.\nThis cannot be undone.\n\nAre you absolutely sure?"
    )) return;
    localStorage.clear();
    window.location.reload();
  }

  return (
    <div className="page">
      <h1 className="page-title">Settings</h1>

      {/* ── Appearance ── */}
      <div className="settings-section">
        <p className="settings-section-title">Appearance</p>
        <div className="setting-row">
          <div>
            <div className="setting-label">Dark Mode</div>
            <div className="setting-desc">Switch between light and dark themes</div>
          </div>
          <ToggleSwitch checked={theme === "dark"} onChange={toggleTheme} />
        </div>
      </div>

      {/* ── Preferences ── */}
      <div className="settings-section">
        <p className="settings-section-title">Preferences</p>
        <div className="setting-row">
          <div>
            <div className="setting-label">Auto-fill macros from meals</div>
            <div className="setting-desc">Default state for the auto-fill toggle when opening a log</div>
          </div>
          <ToggleSwitch checked={autoFillDefault} onChange={handleAutoFillToggle} />
        </div>
      </div>

      {/* ── Profile ── */}
      <div className="settings-section">
        <p className="settings-section-title">Profile</p>
        <div className="setting-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: 14 }}>
          {!editingProfile ? (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 600 }}>
                  {profile.name || "—"}
                  {profile.age    ? `, ${profile.age}`     : ""}
                  {profile.gender ? ` · ${profile.gender}` : ""}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  @{activeUser.username}
                  {profile.heightCm     ? ` · ${profile.heightCm} cm`           : ""}
                  {profile.weightKg     ? ` · ${profile.weightKg} kg`           : ""}
                  {profile.dietCategory ? ` · ${profile.dietCategory}`          : ""}
                </div>
              </div>
              <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => setEditingProfile(true)}>
                Edit profile
              </button>
            </>
          ) : (
            <form onSubmit={handleProfileSave} style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { label: "Name *",       name: "name",     type: "text",   required: true,  extra: {} },
                  { label: "Age *",        name: "age",      type: "number", required: true,  extra: { min: 1, max: 120 } },
                  { label: "Height (cm)",  name: "heightCm", type: "number", required: false, extra: { min: 50, max: 300, placeholder: "optional" } },
                  { label: "Weight (kg)",  name: "weightKg", type: "number", required: false, extra: { min: 0, step: 0.1,  placeholder: "optional" } },
                ].map(({ label, name, type, required, extra }) => (
                  <label key={name} style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: "var(--text-secondary)" }}>
                    {label}
                    <input type={type} name={name} value={profileForm[name]} onChange={handleProfileChange} required={required} {...extra} style={inp} />
                  </label>
                ))}

                <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: "var(--text-secondary)" }}>
                  Gender
                  <select name="gender" value={profileForm.gender} onChange={handleProfileChange} style={inp}>
                    <option value="">Select…</option>
                    <option>Female</option>
                    <option>Male</option>
                    <option>Other</option>
                    <option>Prefer not to say</option>
                  </select>
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: "var(--text-secondary)" }}>
                  Diet Category
                  <select name="dietCategory" value={profileForm.dietCategory} onChange={handleProfileChange} style={inp}>
                    <option value="">Not specified</option>
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Eggetarian">Eggetarian</option>
                    <option value="Non-vegetarian">Non-vegetarian</option>
                    <option value="Vegan">Vegan</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </label>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button type="submit" className="btn-primary" style={{ fontSize: 13 }}>Save</button>
                <button type="button" className="btn-secondary" style={{ fontSize: 13 }} onClick={() => setEditingProfile(false)}>Cancel</button>
              </div>
            </form>
          )}
        </div>

        {/* Switch user */}
        <div className="setting-row">
          <div>
            <div className="setting-label">Switch User</div>
            <div className="setting-desc">Log out and select a different account</div>
          </div>
          <button className="btn-secondary" style={{ fontSize: 13, whiteSpace: "nowrap" }} onClick={onSwitchUser}>
            Switch user
          </button>
        </div>
      </div>

      {/* ── Goals ── */}
      <div className="settings-section">
        <p className="settings-section-title">Goals</p>
        <div className="setting-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: 14 }}>
          {!editingGoals ? (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 600 }}>
                  {profile.weeklyActiveMinutesGoal ?? 150} min / week active
                  {profile.preferredDeficit ? ` · −${profile.preferredDeficit} kcal deficit` : ""}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  Used by Workouts streak and Suggestions deficit target. Goal weight is set in Calorie Intelligence.
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => setEditingGoals(true)}>
                  Edit goals
                </button>
                {goalSaved && (
                  <span style={{ fontSize: 13, color: "#15803d", alignSelf: "center" }}>✓ Saved</span>
                )}
              </div>
            </>
          ) : (
            <form onSubmit={handleGoalSave} style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: "var(--text-secondary)" }}>
                  Weekly Active Minutes Goal
                  <input
                    type="number"
                    name="weeklyActiveMinutesGoal"
                    value={goalForm.weeklyActiveMinutesGoal}
                    onChange={handleGoalChange}
                    min="10"
                    max="1000"
                    step="10"
                    style={inp}
                  />
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>WHO recommends 150 min/week</span>
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: "var(--text-secondary)" }}>
                  Preferred Deficit (kcal/day)
                  <select name="preferredDeficit" value={goalForm.preferredDeficit} onChange={handleGoalChange} style={inp}>
                    <option value="300">300 kcal — Moderate cut (≈ −0.27 kg/week)</option>
                    <option value="500">500 kcal — Aggressive cut (≈ −0.45 kg/week)</option>
                  </select>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Used as default in Suggestions</span>
                </label>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button type="submit" className="btn-primary" style={{ fontSize: 13 }}>Save goals</button>
                <button type="button" className="btn-secondary" style={{ fontSize: 13 }} onClick={() => setEditingGoals(false)}>Cancel</button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ── Export / Import ── */}
      <div className="settings-section">
        <p className="settings-section-title">Data &amp; Export</p>

        <div className="setting-row">
          <div>
            <div className="setting-label">Export your data</div>
            <div className="setting-desc">
              Download your profile, logs, and workouts as a JSON file.
            </div>
          </div>
          <button className="btn-secondary" style={{ fontSize: 13, whiteSpace: "nowrap" }} onClick={handleExport}>
            Export JSON
          </button>
        </div>

        <div className="setting-row">
          <div>
            <div className="setting-label">Import data</div>
            <div className="setting-desc">
              Restore from a FitLog export file. Overwrites current data for this user.
            </div>
          </div>
          <div>
            <input
              ref={importRef}
              type="file"
              accept=".json,application/json"
              style={{ display: "none" }}
              onChange={handleImportFile}
            />
            <button
              className="btn-secondary"
              style={{ fontSize: 13, whiteSpace: "nowrap" }}
              onClick={() => importRef.current?.click()}
            >
              Import JSON
            </button>
          </div>
        </div>

        {importMsg && (
          <div style={{ padding: "8px 14px", borderRadius: 8, fontSize: 13, background: importMsg.type === "error" ? "#fef2f2" : "#dcfce7", color: importMsg.type === "error" ? "#b91c1c" : "#15803d", border: `1px solid ${importMsg.type === "error" ? "#fca5a5" : "#86efac"}`, marginTop: 8 }}>
            {importMsg.type === "error" ? "⚠️ " : "✓ "}{importMsg.text}
          </div>
        )}
      </div>

      {/* ── Danger zone ── */}
      <div className="settings-section">
        <p className="settings-section-title">Danger Zone</p>
        <div className="setting-row">
          <div>
            <div className="setting-label" style={{ color: "#ef4444" }}>Reset All Data</div>
            <div className="setting-desc">Permanently delete all users and logs. Cannot be undone.</div>
          </div>
          <button className="btn-danger" style={{ fontSize: 13, whiteSpace: "nowrap" }} onClick={handleResetAll}>
            Reset all
          </button>
        </div>
      </div>
    </div>
  );
}
