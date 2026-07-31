import { Router } from 'express';
import {
  createProperty,
  deleteProperty,
  getOwnerProperty,
  getProperties,
  getPropertyById,
  updateProperty,
} from '../controllers/propertyController.js';
import {
  authenticate,
  authorizeRoles,
  USER_ROLES,
} from '../middleware/authMiddleware.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(getProperties));
router.post(
  '/',
  asyncHandler(authenticate),
  authorizeRoles(USER_ROLES.OWNER),
  asyncHandler(createProperty),
);
router.get(
  '/:id/manage',
  asyncHandler(authenticate),
  authorizeRoles(USER_ROLES.OWNER),
  asyncHandler(getOwnerProperty),
);
router.put(
  '/:id',
  asyncHandler(authenticate),
  authorizeRoles(USER_ROLES.OWNER),
  asyncHandler(updateProperty),
);
router.delete(
  '/:id',
  asyncHandler(authenticate),
  authorizeRoles(USER_ROLES.OWNER),
  asyncHandler(deleteProperty),
);
router.get('/:id', asyncHandler(getPropertyById));

export default router;
