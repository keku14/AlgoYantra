import { createContext, useContext, useEffect, useState } from "react";

import api from "../api/client.js";

const AuthContext = createContext(null);
const DEFAULT_DASHBOARD_TAB = "classrooms";
const DASHBOARD_TAB_STORAGE_KEYS = {
  teacher: "algoyantra_teacher_active_tab",
  student: "algoyantra_student_active_tab",
};

function resetDashboardTab(role) {
  const storageKey = DASHBOARD_TAB_STORAGE_KEYS[role];

  if (storageKey) {
    localStorage.setItem(storageKey, DEFAULT_DASHBOARD_TAB);
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("algoyantra_token"));
  const [user, setUser] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [activeClassroom, setActiveClassroom] = useState(null);
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
      setClassrooms(data.classrooms || []);
      setActiveClassroom(data.activeClassroom || null);
    } catch (error) {
      localStorage.removeItem("algoyantra_token");
      setToken(null);
      setUser(null);
      setPerformance(null);
      setClassrooms([]);
      setActiveClassroom(null);
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
    resetDashboardTab(data.user?.role);
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
    setClassrooms([]);
    setActiveClassroom(null);
  }

  async function createClassroom(payload) {
    const { data } = await api.post("/classrooms", payload);
    await fetchProfile();
    return data;
  }

  async function joinClassroom(payload) {
    const { data } = await api.post("/classrooms/join", payload);
    await fetchProfile();
    return data;
  }

  async function leaveClassroom(classroomId) {
    const { data } = await api.delete(`/classrooms/${classroomId}/leave`);
    await fetchProfile();
    return data;
  }

  async function switchClassroom(classroomId) {
    const { data } = await api.patch(`/classrooms/${classroomId}/active`);
    await fetchProfile();
    return data.activeClassroom;
  }

  async function clearActiveClassroom() {
    const { data } = await api.patch("/classrooms/active/clear");
    await fetchProfile();
    return data.activeClassroom;
  }

  async function updateClassroom(classroomId, payload) {
    const { data } = await api.put(`/classrooms/${classroomId}`, payload);
    await fetchProfile();
    return data.classroom;
  }

  async function deleteClassroom(classroomId) {
    const { data } = await api.delete(`/classrooms/${classroomId}`);
    await fetchProfile();
    return data;
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        performance,
        classrooms,
        activeClassroom,
        loading,
        isAuthenticated: Boolean(user),
        login: (payload) => authenticate("login", payload),
        signup: (payload) => authenticate("signup", payload),
        createClassroom,
        joinClassroom,
        leaveClassroom,
        switchClassroom,
        clearActiveClassroom,
        updateClassroom,
        deleteClassroom,
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
