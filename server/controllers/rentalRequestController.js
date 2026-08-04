import {
  createRentalRequest as createRentalRequestRecord,
  findOwnerRentalRequests,
  findTenantRentalRequests,
  updateOwnerRentalRequestStatus as updateOwnerRentalRequestStatusRecord,
} from '../services/rentalRequestService.js';
import ApiError from '../utils/ApiError.js';
import {
  validateCreateRentalRequestPayload,
  validateOwnerRentalRequestDecision,
  validateRentalRequestId,
} from '../utils/rentalRequestValidation.js';

export async function createRentalRequest(request, response) {
  const payload = validateCreateRentalRequestPayload(request.body);
  const rentalRequest = await createRentalRequestRecord(
    request.user.id,
    payload,
  );

  if (!rentalRequest) {
    throw new ApiError(
      500,
      'Rental request was created, but the saved record could not be loaded.',
    );
  }

  return response.status(201).json({
    success: true,
    message: 'Rental request sent successfully.',
    data: { rentalRequest },
  });
}

export async function getMyRentalRequests(request, response) {
  const rentalRequests = await findTenantRentalRequests(request.user.id);

  return response.status(200).json({
    success: true,
    message: 'Rental requests retrieved successfully.',
    data: {
      rentalRequests,
      count: rentalRequests.length,
    },
  });
}

export async function getOwnerRentalRequests(request, response) {
  const rentalRequests = await findOwnerRentalRequests(request.user.id);

  return response.status(200).json({
    success: true,
    message: 'Owner rental requests retrieved successfully.',
    data: {
      rentalRequests,
      count: rentalRequests.length,
    },
  });
}

export async function updateOwnerRentalRequestStatus(request, response) {
  const requestId = validateRentalRequestId(request.params.requestId);
  const { status } = validateOwnerRentalRequestDecision(request.body);
  const rentalRequest = await updateOwnerRentalRequestStatusRecord(
    request.user.id,
    requestId,
    status,
  );

  if (!rentalRequest) {
    throw new ApiError(
      500,
      'Rental request was updated, but the saved record could not be loaded.',
    );
  }

  return response.status(200).json({
    success: true,
    message: `Rental request ${status === 'approved' ? 'accepted' : 'rejected'} successfully.`,
    data: { rentalRequest },
  });
}
