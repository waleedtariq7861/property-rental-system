import apiClient from '../api/apiClient.js';

const ROLE_TEST_ENDPOINTS = Object.freeze({
  owner: '/auth/owner-test',
  admin: '/auth/admin-test',
});

export async function registerAccount(payload) {
  const response = await apiClient.post('/auth/register', payload);
  return response.data;
}

export async function loginAccount(payload) {
  const response = await apiClient.post('/auth/login', payload);
  return response.data;
}

export async function getAuthenticatedProfile(options = {}) {
  const response = await apiClient.get('/auth/profile', options);
  return response.data;
}

export async function getRoleTest(role, options = {}) {
  const endpoint = ROLE_TEST_ENDPOINTS[role];

  if (!endpoint) {
    throw new Error('Unsupported role test.');
  }

  const response = await apiClient.get(endpoint, options);
  return response.data;
}
