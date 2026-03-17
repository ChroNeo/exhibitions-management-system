import liff from "@line/liff";
import axios from "axios";
import { getMockLineUserId, isLiffMockEnabled } from "../hooks/useLiff";

const liffClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1",
  timeout: 10000,
});

const isDev = import.meta.env.DEV;

// Request interceptor to add LIFF ID token or mock header
liffClient.interceptors.request.use(
  (config) => {
    // Mock mode is only allowed in development
    if (isLiffMockEnabled()) {
      if (!isDev) {
        return Promise.reject(
          new Error("LIFF Mock mode is not allowed in production"),
        );
      }
      const mockUserId = getMockLineUserId();
      if (!mockUserId) {
        return Promise.reject(
          new Error(
            "LIFF Mock mode enabled but VITE_MOCK_LINE_USER_ID is not set",
          ),
        );
      }
      config.headers["X-Mock-Line-User-Id"] = mockUserId;
      if (isDev) config.headers["ngrok-skip-browser-warning"] = "true";
      return config;
    }

    const idToken = liff.getIDToken();
    if (!idToken) {
      return Promise.reject(new Error("Failed to get LIFF ID token"));
    }

    config.headers.Authorization = `Bearer ${idToken}`;
    if (isDev) config.headers["ngrok-skip-browser-warning"] = "true";

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor (optional logging)
liffClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("LIFF API error:", error);
    return Promise.reject(error);
  },
);

export default liffClient;
