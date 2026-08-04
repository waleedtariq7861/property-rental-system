import { Router } from 'express';
import {
  createRentalRequest,
  getMyRentalRequests,
  getOwnerRentalRequests,
  updateOwnerRentalRequestStatus,
} from '../controllers/rentalRequestController.js';
import {
  authenticate,
  authorizeRoles,
  USER_ROLES,
} from '../middleware/authMiddleware.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.use(asyncHandler(authenticate));

router.post(
  '/',
  authorizeRoles(USER_ROLES.TENANT),
  asyncHandler(createRentalRequest),
);
router.get(
  '/my-requests',
  authorizeRoles(USER_ROLES.TENANT),
  asyncHandler(getMyRentalRequests),
);
router.get(
  '/owner-requests',
  authorizeRoles(USER_ROLES.OWNER),
  asyncHandler(getOwnerRentalRequests),
);
router.patch(
  '/:requestId/status',
  authorizeRoles(USER_ROLES.OWNER),
  asyncHandler(updateOwnerRentalRequestStatus),
);

export default router;
