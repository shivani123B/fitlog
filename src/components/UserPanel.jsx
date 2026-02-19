import { useState } from "react";

// Generates a username: first 3 alphanumeric chars of name (lowercased)
// + last 2 digits of age + 4 random base36 chars.
// Retries if there is a collision with an existing username.
function generateUsername(name, age, existingUsernames) {
  const prefix = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 3)
    .padEnd(3, "x"); // pad with 'x' if name is very short

  const agePart = String(Math.floor(Number(age))).slice(-2).padStart(2, "0");

  let username;
  let attempts = 0;
  do {
    const rand = Math.random().toString(36).slice(2, 6); // 4 base36 chars
    username = `${prefix}${agePart}${rand}`;
    attempts++;
    if (attempts > 200) break; // safety valve
  } while (existingUsernames.includes(username));

  return username;
}

const EMPTY_FORM = {
  name: "",
  age: "",
  heightCm: "",
  weightKg: "",
  gender: "",
  dietCategory: "",
};

export default function UserPanel({ users, activeUsername, onCreateUser, onSelectUser }) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [searchQuery, setSearchQuery] = useState("");
  // After creation, store { username, name } to show the success banner
  const [createdInfo, setCreatedInfo] = useState(null);
  const [copied, setCopied] = useState(false);

  const activeUser = users.find((u) => u.username === activeUsername);

  function handleFormChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleCreateSubmit(e) {
    e.preventDefault();

    const existingUsernames = users.map((u) => u.username);
    const username = generateUsername(form.name, form.age, existingUsernames);

    const newUser = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      username,
      profile: {
        name:         form.name.trim(),
        age:          Number(form.age),
        heightCm:     form.heightCm     !== "" ? Number(form.heightCm)     : null,
        weightKg:     form.weightKg     !== "" ? Number(form.weightKg)     : null,
        gender:       form.gender,
        dietCategory: form.dietCategory || null,
      },
      createdAt: new Date().toISOString(),
    };

    onCreateUser(newUser); // App.jsx saves user + switches to them
    setCreatedInfo({ username, name: form.name.trim() });
    setForm(EMPTY_FORM);
    setShowCreateForm(false);
    setCopied(false);
  }

  function handleCopy() {
    navigator.clipboard.writeText(createdInfo.username).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // Case-insensitive substring match, only when query is non-empty
  const searchResults =
    searchQuery.trim() === ""
      ? []
      : users.filter((u) =>
          u.username.toLowerCase().includes(searchQuery.trim().toLowerCase())
        );

  // ---- Shared styles ----
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
      {/* ── Active user banner ── */}
      {activeUser && (
        <div
          style={{
            background: "var(--accent-light)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 14, color: "var(--text-primary)" }}>
            Active user:{" "}
            <strong style={{ fontFamily: "monospace" }}>{activeUser.username}</strong>
            <span style={{ color: "var(--text-secondary)", marginLeft: 6 }}>({activeUser.profile.name})</span>
          </span>
          <button
            onClick={() =>
              document
                .getElementById("user-search-section")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            style={{
              background: "none",
              border: "none",
              color: "var(--accent)",
              cursor: "pointer",
              fontSize: 13,
              padding: 0,
              textDecoration: "underline",
            }}
          >
            Switch user
          </button>
        </div>
      )}

      {/* ── Post-creation success banner ── */}
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
            {" "}— save this to log in later.
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
            ×
          </button>
        </div>
      )}

      {/* ── Two-column panel row ── */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>

        {/* ── Section A: Create a user ── */}
        <div style={panelStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: showCreateForm ? 14 : 0,
            }}
          >
            <h3 style={{ margin: 0, fontSize: 16, color: "var(--text-primary)" }}>Create a user</h3>
            <button
              onClick={() => setShowCreateForm((v) => !v)}
              className={showCreateForm ? "btn-secondary" : "btn-primary"}
              style={{ fontSize: 13 }}
            >
              {showCreateForm ? "Cancel" : "Create a user"}
            </button>
          </div>

          {showCreateForm && (
            <form onSubmit={handleCreateSubmit}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={labelStyle}>
                  Name *
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    required
                    placeholder="Your full name"
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Age *
                  <input
                    type="number"
                    name="age"
                    value={form.age}
                    onChange={handleFormChange}
                    required
                    min="1"
                    max="120"
                    placeholder="e.g. 28"
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Gender *
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleFormChange}
                    required
                    style={inputStyle}
                  >
                    <option value="">Select…</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </label>

                <label style={labelStyle}>
                  Diet Category — optional
                  <select
                    name="dietCategory"
                    value={form.dietCategory}
                    onChange={handleFormChange}
                    style={inputStyle}
                  >
                    <option value="">Select…</option>
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Eggetarian">Eggetarian</option>
                    <option value="Non-vegetarian">Non-vegetarian</option>
                    <option value="Vegan">Vegan</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </label>

                <label style={labelStyle}>
                  Height (cm) — optional
                  <input
                    type="number"
                    name="heightCm"
                    value={form.heightCm}
                    onChange={handleFormChange}
                    min="50"
                    max="300"
                    placeholder="e.g. 170"
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Weight (kg) — optional
                  <input
                    type="number"
                    name="weightKg"
                    value={form.weightKg}
                    onChange={handleFormChange}
                    step="0.1"
                    min="0"
                    placeholder="e.g. 70.5"
                    style={inputStyle}
                  />
                </label>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: "9px 0", fontSize: 14, marginTop: 4 }}
                >
                  Create user
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ── Section B: Already a user (search) ── */}
        <div id="user-search-section" style={panelStyle}>
          <h3 style={{ margin: "0 0 12px", fontSize: 16, color: "var(--text-primary)" }}>Already a user?</h3>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username…"
            style={{ ...inputStyle, marginBottom: 8 }}
          />

          {/* Hint when no query */}
          {searchQuery.trim() === "" && (
            <p style={{ color: "var(--text-muted)", fontSize: 12, margin: 0 }}>
              {users.length === 0
                ? "No users yet. Create one to get started."
                : `Type to search among ${users.length} user${users.length !== 1 ? "s" : ""}.`}
            </p>
          )}

          {/* No results */}
          {searchQuery.trim() !== "" && searchResults.length === 0 && (
            <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: 0 }}>No users found.</p>
          )}

          {/* Results list */}
          {searchResults.length > 0 && (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {searchResults.map((u) => {
                const isActive = u.username === activeUsername;
                return (
                  <li
                    key={u.username}
                    onClick={() => {
                      onSelectUser(u.username);
                      setSearchQuery("");
                    }}
                    style={{
                      padding: "9px 12px",
                      borderRadius: 6,
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: isActive ? "var(--accent-light)" : "var(--bg-secondary)",
                      marginBottom: 4,
                      border: `1px solid ${isActive ? "var(--accent)" : "var(--border)"}`,
                    }}
                  >
                    <span>
                      <strong style={{ fontFamily: "monospace", color: "var(--text-primary)" }}>{u.username}</strong>
                      <span style={{ color: "var(--text-secondary)", fontSize: 13, marginLeft: 8 }}>
                        {u.profile.name}
                      </span>
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: isActive ? "#388e3c" : "var(--accent)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {isActive ? "Active ✓" : "Select →"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
