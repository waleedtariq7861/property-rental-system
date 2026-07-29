import { Router } from 'express';
import { getOwnerDashboard } from '../controllers/ownerDashboardController.js';
import {
  authenticate,
  authorizeRoles,
  USER_ROLES,
} from '../middleware/authMiddleware.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.get(
  '/dashboard',
  asyncHandler(authenticate),
  authorizeRoles(USER_ROLES.OWNER),
  asyncHandler(getOwnerDashboard),
);

export default router;
