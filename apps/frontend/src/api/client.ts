import axios from "axios";
import { loadAuth } from "../utils/authStorage";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:3001/api/v1",
  timeout: 10000,
});

// Request interceptor to add Authorization header
api.interceptors.request.use(
  (config) => {
    const auth = loadAuth();
    if (auth && auth.token) {
      config.headers.Authorization = `${auth.tokenType} ${auth.token}`;
    }
    return config;
  },
  (err) => {
    return Promise.reject(err);
  }
);

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("API error:", err);
    return Promise.reject(err);
  }
);

export default api;
