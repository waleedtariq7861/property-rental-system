import { Router } from 'express';
import {
  createProperty,
  getProperties,
  getPropertyById,
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
router.get('/:id', asyncHandler(getPropertyById));

export default router;
