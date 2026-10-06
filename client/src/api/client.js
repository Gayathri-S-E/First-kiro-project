import axios from "axios";

const rawBase = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "https://first-kiro-project.onrender.com/api" : "/api");
const cleanBase = rawBase.replace(/\/+$/, "");
const baseURL = cleanBase.endsWith("/api") ? cleanBase : `${cleanBase}/api`;

const api = axios.create({ baseURL });

// Attach JWT token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("fcat_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401 — but only when not already on the login page
// and not when the failed request itself was an auth endpoint (login/me).
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLoginPage = window.location.pathname === "/login"
                     || window.location.pathname === "/home"
                     || window.location.pathname === "/";
    const isAuthEndpoint = err.config?.url?.includes("/auth/");

    if (err.response?.status === 401 && !isLoginPage && !isAuthEndpoint) {
      localStorage.removeItem("fcat_token");
      localStorage.removeItem("fcat_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
