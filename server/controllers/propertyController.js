import {
  findAllAvailableProperties,
  findAvailablePropertyById,
} from '../services/propertyService.js';
import ApiError from '../utils/ApiError.js';
import {
  validatePropertyId,
  validatePropertyQuery,
} from '../utils/propertyValidation.js';

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
