import {
  findAllAvailableProperties,
  findAvailablePropertyById,
} from '../services/propertyService.js';
import ApiError from '../utils/ApiError.js';
import { validatePropertyId } from '../utils/propertyValidation.js';

export async function getProperties(request, response) {
  const properties = await findAllAvailableProperties();

  return response.status(200).json({
    success: true,
    message: 'Properties retrieved successfully.',
    data: {
      properties,
      count: properties.length,
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
