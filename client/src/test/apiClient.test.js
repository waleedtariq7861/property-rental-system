import { describe, expect, it } from 'vitest';
import apiClient from '../api/apiClient.js';
import { saveStoredAuth } from '../utils/authStorage.js';

describe('authenticated API client', () => {
  it('adds the stored JWT using the Bearer authorization format', async () => {
    saveStoredAuth({
      token: 'phase-one-test-token',
      user: {
        id: 201,
        fullName: 'API Client Test User',
        email: 'api.client@example.test',
        role: 'tenant',
      },
    });

    const response = await apiClient.get('/test-auth-header', {
      adapter: async (config) => ({
        config,
        data: {
          authorization: config.headers.get('Authorization'),
        },
        headers: {},
        status: 200,
        statusText: 'OK',
      }),
    });

    expect(response.data.authorization).toBe('Bearer phase-one-test-token');
  });
});
