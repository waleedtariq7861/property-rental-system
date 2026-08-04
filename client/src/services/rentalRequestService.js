import apiClient from '../api/apiClient.js';

export async function createRentalRequest(payload, options = {}) {
  const response = await apiClient.post('/rental-requests', payload, options);
  return response.data;
}

export async function getMyRentalRequests(options = {}) {
  const response = await apiClient.get(
    '/rental-requests/my-requests',
    options,
  );
  return response.data;
}

export async function getOwnerRentalRequests(options = {}) {
  const response = await apiClient.get(
    '/rental-requests/owner-requests',
    options,
  );
  return response.data;
}

export async function updateOwnerRentalRequestStatus(
  requestId,
  status,
  options = {},
) {
  const response = await apiClient.patch(
    `/rental-requests/${requestId}/status`,
    { status },
    options,
  );
  return response.data;
}
