import axios from "axios";

const api = axios.create({ baseURL: "/api" });

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
