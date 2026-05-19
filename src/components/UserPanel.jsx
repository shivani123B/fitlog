import { useState } from "react";

const EMPTY_FORM = {
  name: "",
  age: "",
  heightCm: "",
  weightKg: "",
  gender: "",
  dietCategory: "",
  password: "",
};

export default function UserPanel({ onRegister, onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(EMPTY_FORM);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [createdInfo, setCreatedInfo] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  function handleFormChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await onRegister({
        name: form.name.trim(),
        age: Number(form.age),
        password: form.password,
        gender: form.gender || null,
        diet_category: form.dietCategory || null,
        height_cm: form.heightCm ? Number(form.heightCm) : null,
        weight_kg: form.weightKg ? Number(form.weightKg) : null,
      });
      setCreatedInfo({ username: res.username, name: form.name.trim() });
      setForm(EMPTY_FORM);
      setCopied(false);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await onLogin(loginForm.username.trim(), loginForm.password);
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(createdInfo.username).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const inputStyle = {
    padding: "7px 9px",
    border: "1px solid var(--border)",
    borderRadius: 4,
    fontSize: 14,
    width: "100%",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    fontSize: 13,
    color: "var(--text-secondary)",
  };

  const panelStyle = {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: 16,
    flex: "1 1 300px",
  };

  return (
    <div>
      {createdInfo && (
        <div
          style={{
            background: "var(--accent-light)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 14, color: "var(--text-primary)" }}>
            User created! Your username:{" "}
            <strong style={{ fontFamily: "monospace", fontSize: 15 }}>
              {createdInfo.username}
            </strong>
            {" "}&mdash; save this to log in later.
          </span>
          <button
            onClick={handleCopy}
            className="btn-primary"
            style={{
              padding: "4px 12px",
              fontSize: 12,
              background: copied ? "#4CAF50" : "var(--accent)",
            }}
          >
            {copied ? "Copied!" : "Copy username"}
          </button>
          <button
            onClick={() => setCreatedInfo(null)}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 18,
              color: "var(--text-muted)",
              lineHeight: 1,
            }}
            title="Dismiss"
          >
            &times;
          </button>
        </div>
      )}

      {error && (
        <div style={{
          background: "#fef2f2",
          border: "1px solid #fca5a5",
          borderRadius: 8,
          padding: "8px 14px",
          marginBottom: 12,
          fontSize: 13,
          color: "#b91c1c",
        }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {/* Register */}
        <div style={panelStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: mode === "register" ? 14 : 0,
            }}
          >
            <h3 style={{ margin: 0, fontSize: 16, color: "var(--text-primary)" }}>Create account</h3>
            <button
              onClick={() => { setMode(mode === "register" ? "login" : "register"); setError(null); }}
              className={mode === "register" ? "btn-secondary" : "btn-primary"}
              style={{ fontSize: 13 }}
            >
              {mode === "register" ? "Cancel" : "Register"}
            </button>
          </div>

          {mode === "register" && (
            <form onSubmit={handleRegister}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={labelStyle}>
                  Name *
                  <input type="text" name="name" value={form.name} onChange={handleFormChange} required placeholder="Your full name" style={inputStyle} />
                </label>
                <label style={labelStyle}>
                  Age *
                  <input type="number" name="age" value={form.age} onChange={handleFormChange} required min="1" max="120" placeholder="e.g. 28" style={inputStyle} />
                </label>
                <label style={labelStyle}>
                  Password *
                  <input type="password" name="password" value={form.password} onChange={handleFormChange} required minLength="8" placeholder="Min 8 characters" style={inputStyle} />
                </label>
                <label style={labelStyle}>
                  Gender *
                  <select name="gender" value={form.gender} onChange={handleFormChange} required style={inputStyle}>
                    <option value="">Select&hellip;</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </label>
                <label style={labelStyle}>
                  Diet Category &mdash; optional
                  <select name="dietCategory" value={form.dietCategory} onChange={handleFormChange} style={inputStyle}>
                    <option value="">Select&hellip;</option>
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Eggetarian">Eggetarian</option>
                    <option value="Non-vegetarian">Non-vegetarian</option>
                    <option value="Vegan">Vegan</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </label>
                <label style={labelStyle}>
                  Height (cm) &mdash; optional
                  <input type="number" name="heightCm" value={form.heightCm} onChange={handleFormChange} min="50" max="300" placeholder="e.g. 170" style={inputStyle} />
                </label>
                <label style={labelStyle}>
                  Weight (kg) &mdash; optional
                  <input type="number" name="weightKg" value={form.weightKg} onChange={handleFormChange} step="0.1" min="0" placeholder="e.g. 70.5" style={inputStyle} />
                </label>
                <button type="submit" className="btn-primary" style={{ padding: "9px 0", fontSize: 14, marginTop: 4 }} disabled={busy}>
                  {busy ? "Creating..." : "Create account"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Login */}
        <div style={panelStyle}>
          <h3 style={{ margin: "0 0 12px", fontSize: 16, color: "var(--text-primary)" }}>Already a user?</h3>
          <form onSubmit={handleLogin}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <label style={labelStyle}>
                Username
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  required
                  placeholder="Your username"
                  style={inputStyle}
                />
              </label>
              <label style={labelStyle}>
                Password
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                  placeholder="Your password"
                  style={inputStyle}
                />
              </label>
              <button type="submit" className="btn-primary" style={{ padding: "9px 0", fontSize: 14, marginTop: 4 }} disabled={busy}>
                {busy ? "Logging in..." : "Log in"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
