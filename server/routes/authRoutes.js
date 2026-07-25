import { Router } from 'express';
import {
  getAdminTest,
  getAuthenticatedProfile,
  getOwnerTest,
  loginUser,
  registerUser,
} from '../controllers/authController.js';
import {
  authenticate,
  authorizeRoles,
  USER_ROLES,
} from '../middleware/authMiddleware.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.post('/register', asyncHandler(registerUser));
router.post('/login', asyncHandler(loginUser));
router.get('/profile', asyncHandler(authenticate), getAuthenticatedProfile);
router.get(
  '/owner-test',
  asyncHandler(authenticate),
  authorizeRoles(USER_ROLES.OWNER),
  getOwnerTest,
);
router.get(
  '/admin-test',
  asyncHandler(authenticate),
  authorizeRoles(USER_ROLES.ADMIN),
  getAdminTest,
);

export default router;
