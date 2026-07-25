import axios from 'axios';
import {
  AUTH_INVALID_EVENT,
  clearStoredAuth,
  getStoredToken,
} from '../utils/authStorage.js';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    Accept: 'application/json',
  },
  timeout: 8000,
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.endsWith('/auth/login');

    if (error.response?.status === 401 && !isLoginRequest) {
      clearStoredAuth();

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(AUTH_INVALID_EVENT));
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
