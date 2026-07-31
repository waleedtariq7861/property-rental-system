import apiClient from '../api/apiClient.js';

export const PROPERTY_DATA_CHANGED_EVENT = 'rentease:properties-changed';

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

export async function getOwnerProperty(propertyId, options = {}) {
  const response = await apiClient.get(`/properties/${propertyId}/manage`, options);
  return response.data;
}

export async function updateProperty(propertyId, payload, options = {}) {
  const response = await apiClient.put(`/properties/${propertyId}`, payload, options);
  notifyPropertyDataChanged();
  return response.data;
}

export async function deleteProperty(propertyId, options = {}) {
  const response = await apiClient.delete(`/properties/${propertyId}`, options);
  notifyPropertyDataChanged();
  return response.data;
}

function notifyPropertyDataChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(PROPERTY_DATA_CHANGED_EVENT));
  }
}
