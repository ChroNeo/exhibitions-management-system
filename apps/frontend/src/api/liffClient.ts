import axios from 'axios';
import liff from '@line/liff';
import { isLiffMockEnabled, getMockLineUserId } from '../hooks/useLiff';

const liffClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:3001/api/v1',
  timeout: 10000,
});

// Request interceptor to add LIFF ID token or mock header
liffClient.interceptors.request.use(
  (config) => {
    // If mock mode is enabled, use mock header instead of LIFF token
    if (isLiffMockEnabled()) {
      const mockUserId = getMockLineUserId();
      if (!mockUserId) {
        return Promise.reject(new Error('LIFF Mock mode enabled but VITE_MOCK_LINE_USER_ID is not set'));
      }
      config.headers['X-Mock-Line-User-Id'] = mockUserId;
      config.headers['ngrok-skip-browser-warning'] = 'true';
      return config;
    }

    const idToken = liff.getIDToken();
    if (!idToken) {
      return Promise.reject(new Error('Failed to get LIFF ID token'));
    }

    config.headers.Authorization = `Bearer ${idToken}`;
    config.headers['ngrok-skip-browser-warning'] = 'true';

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor (optional logging)
liffClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('LIFF API error:', error);
    return Promise.reject(error);
  }
);

export default liffClient;
