import apiClient from '../api/apiClient.js';

export async function getHealthStatus(options = {}) {
  const response = await apiClient.get('/health', options);
  return response.data;
}
