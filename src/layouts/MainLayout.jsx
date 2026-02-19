import { useState } from "react";
import { useTheme } from "../context/ThemeContext";

const NAV = [
  { id: "dashboard",            label: "Dashboard",            icon: "📊" },
  { id: "logs",                 label: "Logs",                 icon: "📋" },
  { id: "workouts",             label: "Workouts",             icon: "🏋️" },
  { id: "calorie-intelligence", label: "Calorie Intelligence", icon: "🧠" },
  { id: "suggestions",          label: "Suggestions",          icon: "🍽️" },
  { id: "settings",             label: "Settings",             icon: "⚙️"  },
];

export default function MainLayout({ page, setPage, activeUser, children }) {
  const { theme, toggleTheme } = useTheme();

  // Collapsible sidebar — persisted to localStorage
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("fitlog_sidebar_state") === "collapsed";
  });

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("fitlog_sidebar_state", next ? "collapsed" : "expanded");
      return next;
    });
  }

  const profile = activeUser.profile || {};
  const name    = profile.name || activeUser.username;
  const initial = name.charAt(0).toUpperCase();
  const age     = profile.age;

  return (
    <div className="layout">

      {/* ── Sidebar ── */}
      <aside className={`sidebar${collapsed ? " sidebar-collapsed" : ""}`}>

        {/* Brand + collapse toggle */}
        <div className="sidebar-brand">
          <span className="brand-icon">🏋️</span>
          {!collapsed && <span className="brand-name">FitLog</span>}
          <button
            className="sidebar-collapse-btn"
            onClick={toggleCollapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? "›" : "‹"}
          </button>
        </div>

        {/* Active user */}
        <div className="sidebar-user">
          <div className="user-avatar">{initial}</div>
          {!collapsed && (
            <div className="user-info">
              <div className="user-name">{name}{age ? `, ${age}` : ""}</div>
              <div className="user-handle">@{activeUser.username}</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {NAV.map((item) => (
            <button
              key={item.id}
              className={`nav-item${page === item.id ? " active" : ""}`}
              onClick={() => setPage(item.id)}
              title={collapsed ? item.label : undefined}
              style={collapsed ? { justifyContent: "center", padding: "9px 0" } : undefined}
            >
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && item.label}
            </button>
          ))}
        </nav>

        {/* Theme toggle */}
        <div className="sidebar-footer">
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={collapsed ? (theme === "light" ? "Dark mode" : "Light mode") : undefined}
            style={collapsed ? { justifyContent: "center", padding: "9px 0", gap: 0 } : undefined}
          >
            <span>{theme === "light" ? "🌙" : "☀️"}</span>
            {!collapsed && (
              <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
            )}
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
