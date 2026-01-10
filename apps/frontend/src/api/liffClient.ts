import axios from 'axios';
import liff from '@line/liff';

const liffClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:3001/api/v1',
  timeout: 10000,
});

// Request interceptor to add LIFF ID token
liffClient.interceptors.request.use(
  (config) => {
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
