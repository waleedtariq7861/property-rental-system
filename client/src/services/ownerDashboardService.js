import apiClient from '../api/apiClient.js';

export async function getOwnerDashboard(options = {}) {
  const response = await apiClient.get('/owner/dashboard', options);
  return response.data;
}
