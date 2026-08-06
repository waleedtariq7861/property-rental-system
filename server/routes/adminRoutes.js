import { Router } from 'express';
import {
  getAdminDashboard,
  getAdminProperties,
  getAdminRentalRequests,
  getAdminUsers,
} from '../controllers/adminDashboardController.js';
import {
  authenticate,
  authorizeRoles,
  USER_ROLES,
} from '../middleware/authMiddleware.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.use(asyncHandler(authenticate));
router.use(authorizeRoles(USER_ROLES.ADMIN));

router.get('/dashboard', asyncHandler(getAdminDashboard));
router.get('/users', asyncHandler(getAdminUsers));
router.get('/properties', asyncHandler(getAdminProperties));
router.get('/rental-requests', asyncHandler(getAdminRentalRequests));

export default router;
