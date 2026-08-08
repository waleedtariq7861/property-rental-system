import {
  deletePropertyForAdmin,
  deleteUserForAdmin,
  findAdminDashboard,
  findAllPropertiesForAdmin,
  findAllRentalRequestsForAdmin,
  findAllUsersForAdmin,
  updateUserStatusForAdmin,
} from '../services/adminDashboardService.js';
import {
  validateAdminAccountStatus,
  validateAdminResourceId,
} from '../utils/adminValidation.js';

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

export async function updateAdminUserStatus(request, response) {
  const userId = validateAdminResourceId(request.params.id, 'userId');
  const { accountStatus } = validateAdminAccountStatus(request.body);
  const user = await updateUserStatusForAdmin(
    request.user.id,
    userId,
    accountStatus,
  );

  return response.status(200).json({
    success: true,
    message: `User account ${accountStatus === 'active' ? 'activated' : 'deactivated'} successfully.`,
    data: { user },
  });
}

export async function deleteAdminUser(request, response) {
  const userId = validateAdminResourceId(request.params.id, 'userId');
  const deletedUser = await deleteUserForAdmin(request.user.id, userId);

  return response.status(200).json({
    success: true,
    message: 'User deleted successfully.',
    data: { userId: deletedUser.id },
  });
}

export async function deleteAdminProperty(request, response) {
  const propertyId = validateAdminResourceId(request.params.id, 'propertyId');
  const deletedProperty = await deletePropertyForAdmin(propertyId);

  return response.status(200).json({
    success: true,
    message: 'Property removed successfully.',
    data: { propertyId: deletedProperty.id },
  });
}
