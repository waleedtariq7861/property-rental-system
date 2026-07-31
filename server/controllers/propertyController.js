import {
  createProperty as createPropertyRecord,
  deleteProperty as deletePropertyRecord,
  findAllAvailableProperties,
  findAvailablePropertyById,
  findOwnerPropertyById,
  findPropertyOwnerId,
  updateProperty as updatePropertyRecord,
} from '../services/propertyService.js';
import ApiError from '../utils/ApiError.js';
import {
  validateCreatePropertyPayload,
  validatePropertyId,
  validatePropertyQuery,
  validateUpdatePropertyPayload,
} from '../utils/propertyValidation.js';

async function authorizePropertyOwner(propertyId, request) {
  const propertyOwnerId = await findPropertyOwnerId(propertyId);

  if (propertyOwnerId === null) {
    throw new ApiError(404, 'Property not found.');
  }

  if (Number(propertyOwnerId) !== Number(request.user.id)) {
    throw new ApiError(403, 'You do not have permission to manage this property.');
  }
}

export async function createProperty(request, response) {
  const propertyPayload = validateCreatePropertyPayload(request.body);
  const property = await createPropertyRecord(
    request.user.id,
    propertyPayload,
  );

  if (!property) {
    throw new ApiError(
      500,
      'Property was created, but the saved record could not be loaded.',
    );
  }

  return response.status(201).json({
    success: true,
    message: 'Property created successfully.',
    data: {
      property,
    },
  });
}

export async function getProperties(request, response) {
  const query = validatePropertyQuery(request.query);
  const result = await findAllAvailableProperties(query);

  return response.status(200).json({
    success: true,
    message: 'Properties retrieved successfully.',
    data: {
      properties: result.properties,
      count: result.properties.length,
      totalCount: result.totalCount,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
    },
  });
}

export async function getOwnerProperty(request, response) {
  const propertyId = validatePropertyId(request.params.id);
  await authorizePropertyOwner(propertyId, request);
  const property = await findOwnerPropertyById(request.user.id, propertyId);

  if (!property) {
    throw new ApiError(404, 'Property not found.');
  }

  return response.status(200).json({
    success: true,
    message: 'Owner property retrieved successfully.',
    data: { property },
  });
}

export async function updateProperty(request, response) {
  const propertyId = validatePropertyId(request.params.id);
  await authorizePropertyOwner(propertyId, request);
  const propertyPayload = validateUpdatePropertyPayload(request.body);
  const property = await updatePropertyRecord(
    request.user.id,
    propertyId,
    propertyPayload,
  );

  if (!property) {
    throw new ApiError(404, 'Property not found.');
  }

  return response.status(200).json({
    success: true,
    message: 'Property updated successfully.',
    data: { property },
  });
}

export async function deleteProperty(request, response) {
  const propertyId = validatePropertyId(request.params.id);
  await authorizePropertyOwner(propertyId, request);
  let deleted;

  try {
    deleted = await deletePropertyRecord(request.user.id, propertyId);
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED') {
      throw new ApiError(
        409,
        'This property cannot be deleted because it has related rental activity.',
      );
    }

    throw error;
  }

  if (!deleted) {
    throw new ApiError(404, 'Property not found.');
  }

  return response.status(200).json({
    success: true,
    message: 'Property deleted successfully.',
    data: { propertyId },
  });
}

export async function getPropertyById(request, response) {
  const propertyId = validatePropertyId(request.params.id);
  const property = await findAvailablePropertyById(propertyId);

  if (!property) {
    throw new ApiError(404, 'Property not found.');
  }

  return response.status(200).json({
    success: true,
    message: 'Property retrieved successfully.',
    data: {
      property,
    },
  });
}
