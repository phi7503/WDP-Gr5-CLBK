import axios from "axios";
const api = axios.create({ baseURL: "/api" }); // Vite proxy

api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem("userInfo") || localStorage.getItem("user");
    const parsed = raw ? JSON.parse(raw) : null;
    const token = parsed?.token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {}
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
