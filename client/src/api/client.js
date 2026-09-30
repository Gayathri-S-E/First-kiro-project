import axios from "axios";

const api = axios.create({ baseURL: "/api" });

// Attach JWT token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("fcat_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("fcat_token");
      localStorage.removeItem("fcat_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
