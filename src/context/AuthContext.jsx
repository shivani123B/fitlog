import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { auth, users, setToken, getToken } from "../utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!getToken()) { setLoading(false); return; }
    try {
      const data = await users.me();
      setCurrentUser(data);
    } catch {
      setToken(null);
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  useEffect(() => {
    const handler = () => { setCurrentUser(null); };
    window.addEventListener("auth:expired", handler);
    return () => window.removeEventListener("auth:expired", handler);
  }, []);

  async function register(body) {
    const res = await auth.register(body);
    setToken(res.access_token);
    await fetchProfile();
    return res;
  }

  async function login(username, password) {
    const res = await auth.login(username, password);
    setToken(res.access_token);
    await fetchProfile();
    return res;
  }

  function logout() {
    setToken(null);
    setCurrentUser(null);
  }

  async function refreshProfile() {
    await fetchProfile();
  }

  return (
    <AuthContext.Provider value={{ currentUser, loading, register, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
