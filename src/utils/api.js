const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const TOKEN_KEY = "fitlog_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    setToken(null);
    window.dispatchEvent(new Event("auth:expired"));
    throw new Error("Session expired");
  }

  if (res.status === 204) return null;

  const data = await res.json();
  if (!res.ok) {
    const msg = data.detail || JSON.stringify(data);
    const err = new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
    err.status = res.status;
    throw err;
  }
  return data;
}

// Auth
export const auth = {
  register: (body) =>
    request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (username, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
};

// Users
export const users = {
  me: () => request("/users/me"),
  update: (body) =>
    request("/users/me", { method: "PUT", body: JSON.stringify(body) }),
};

// Logs
export const logs = {
  list: (sort = "desc", limit = 1000) =>
    request(`/logs?sort=${sort}&limit=${limit}`),
  get: (date) => request(`/logs/${date}`),
  create: (body) =>
    request("/logs", { method: "POST", body: JSON.stringify(body) }),
  update: (date, body) =>
    request(`/logs/${date}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (date) => request(`/logs/${date}`, { method: "DELETE" }),
};

// Workouts
export const workouts = {
  list: (date) =>
    request(`/workouts?limit=1000${date ? `&date=${date}` : ""}`),
  create: (body) =>
    request("/workouts", { method: "POST", body: JSON.stringify(body) }),
  delete: (id) => request(`/workouts/${id}`, { method: "DELETE" }),
};

// Calorie Intelligence
export const calorieIntel = {
  get: () => request("/calorie-intel"),
  update: (body) =>
    request("/calorie-intel", { method: "PUT", body: JSON.stringify(body) }),
};

// Data export/import
export const data = {
  exportAll: () => request("/data/export"),
  importAll: (body) =>
    request("/data/import", { method: "POST", body: JSON.stringify(body) }),
};

// Dashboard
export const dashboard = {
  summary: () => request("/dashboard/summary"),
};
