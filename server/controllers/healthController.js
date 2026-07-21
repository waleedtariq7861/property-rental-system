import env from '../config/env.js';
import { checkDatabaseHealth } from '../services/healthService.js';

export async function getHealth(request, response) {
  const databaseHealth = await checkDatabaseHealth();

  if (!databaseHealth.connected) {
    if (env.isDevelopment) {
      const errorSummary =
        databaseHealth.error.code ||
        databaseHealth.error.errors?.[0]?.code ||
        databaseHealth.error.message ||
        'connection could not be established';
      console.error(`Database health check failed: ${errorSummary}`);
    }

    return response.status(503).json({
      success: false,
      message: 'RentEase API is running, but the database is unavailable',
      data: {
        database: 'unavailable',
      },
    });
  }

  return response.status(200).json({
    success: true,
    message: 'RentEase API is running',
    data: {
      database: 'connected',
    },
  });
}
