import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(() => {
    try { return JSON.parse(localStorage.getItem("fcat_user")); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  // Validate token on mount
  useEffect(() => {
    const token = localStorage.getItem("fcat_token");
    if (!token) { setLoading(false); return; }
    api.get("/auth/me")
      .then(({ data }) => setUser(data.user))
      .catch(() => { localStorage.removeItem("fcat_token"); localStorage.removeItem("fcat_user"); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("fcat_token", data.token);
    localStorage.setItem("fcat_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    localStorage.setItem("fcat_token", data.token);
    localStorage.setItem("fcat_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("fcat_token");
    localStorage.removeItem("fcat_user");
    setUser(null);
  };

  const isAdmin = user?.role === "admin";
  const isHod   = user?.role === "hod";
  const isStaff = isAdmin || isHod;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, isAdmin, isHod, isStaff }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
