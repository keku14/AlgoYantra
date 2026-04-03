import { createContext, useContext, useEffect, useState } from "react";

import api from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("algoyantra_token"));
  const [user, setUser] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("algoyantra_token")));

  async function fetchProfile() {
    const storedToken = localStorage.getItem("algoyantra_token");

    if (!storedToken) {
      setUser(null);
      setPerformance(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.get("/auth/me");
      setUser(data.user);
      setPerformance(data.performance || null);
    } catch (error) {
      localStorage.removeItem("algoyantra_token");
      setToken(null);
      setUser(null);
      setPerformance(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  async function authenticate(mode, payload) {
    const endpoint = mode === "signup" ? "/auth/signup" : "/auth/login";
    const { data } = await api.post(endpoint, payload);
    localStorage.setItem("algoyantra_token", data.token);
    setToken(data.token);
    setUser(data.user);
    await fetchProfile();
    return data.user;
  }

  async function refreshProfile() {
    await fetchProfile();
  }

  function logout() {
    localStorage.removeItem("algoyantra_token");
    setToken(null);
    setUser(null);
    setPerformance(null);
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        performance,
        loading,
        isAuthenticated: Boolean(user),
        login: (payload) => authenticate("login", payload),
        signup: (payload) => authenticate("signup", payload),
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
