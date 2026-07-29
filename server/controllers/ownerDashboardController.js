import { findOwnerDashboard } from '../services/ownerDashboardService.js';

export async function getOwnerDashboard(request, response) {
  const dashboard = await findOwnerDashboard(request.user.id);

  return response.status(200).json({
    success: true,
    message: 'Owner dashboard retrieved successfully.',
    data: {
      owner: request.user,
      statistics: dashboard.statistics,
      properties: dashboard.properties,
    },
  });
}
