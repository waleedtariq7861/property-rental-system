import apiClient from '../api/apiClient.js';

export async function getProperties(options = {}) {
  const response = await apiClient.get('/properties', options);
  return response.data;
}

export async function getPropertyById(propertyId, options = {}) {
  const response = await apiClient.get(`/properties/${propertyId}`, options);
  return response.data;
}

export async function createProperty(payload, options = {}) {
  const response = await apiClient.post('/properties', payload, options);
  return response.data;
}
