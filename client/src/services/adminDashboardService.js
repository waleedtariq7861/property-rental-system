import apiClient from '../api/apiClient.js';

export async function getAdminDashboard(options = {}) {
  const response = await apiClient.get('/admin/dashboard', options);
  return response.data;
}

export async function getAdminUsers(options = {}) {
  const response = await apiClient.get('/admin/users', options);
  return response.data;
}

export async function getAdminProperties(options = {}) {
  const response = await apiClient.get('/admin/properties', options);
  return response.data;
}

export async function getAdminRentalRequests(options = {}) {
  const response = await apiClient.get('/admin/rental-requests', options);
  return response.data;
}
