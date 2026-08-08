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

export async function updateAdminUserStatus(userId, accountStatus) {
  const response = await apiClient.patch(`/admin/users/${userId}/status`, {
    accountStatus,
  });
  return response.data;
}

export async function deleteAdminUser(userId) {
  const response = await apiClient.delete(`/admin/users/${userId}`);
  return response.data;
}

export async function deleteAdminProperty(propertyId) {
  const response = await apiClient.delete(`/admin/properties/${propertyId}`);
  return response.data;
}
