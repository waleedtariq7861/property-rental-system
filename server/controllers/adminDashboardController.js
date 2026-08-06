import {
  findAdminDashboard,
  findAllPropertiesForAdmin,
  findAllRentalRequestsForAdmin,
  findAllUsersForAdmin,
} from '../services/adminDashboardService.js';

export async function getAdminDashboard(request, response) {
  const dashboard = await findAdminDashboard();

  return response.status(200).json({
    success: true,
    message: 'Admin dashboard retrieved successfully.',
    data: {
      admin: request.user,
      ...dashboard,
    },
  });
}

export async function getAdminUsers(request, response) {
  const users = await findAllUsersForAdmin();

  return response.status(200).json({
    success: true,
    message: 'Users retrieved successfully.',
    data: { users, count: users.length },
  });
}

export async function getAdminProperties(request, response) {
  const properties = await findAllPropertiesForAdmin();

  return response.status(200).json({
    success: true,
    message: 'Properties retrieved successfully.',
    data: { properties, count: properties.length },
  });
}

export async function getAdminRentalRequests(request, response) {
  const rentalRequests = await findAllRentalRequestsForAdmin();

  return response.status(200).json({
    success: true,
    message: 'Rental requests retrieved successfully.',
    data: { rentalRequests, count: rentalRequests.length },
  });
}
