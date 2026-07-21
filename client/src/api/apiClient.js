import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    Accept: 'application/json',
  },
  timeout: 8000,
});

export default apiClient;
