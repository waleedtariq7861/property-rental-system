import { Router } from 'express';
import {
  createRentalRequest,
  getMyRentalRequests,
} from '../controllers/rentalRequestController.js';
import {
  authenticate,
  authorizeRoles,
  USER_ROLES,
} from '../middleware/authMiddleware.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.use(asyncHandler(authenticate));
router.use(authorizeRoles(USER_ROLES.TENANT));

router.post('/', asyncHandler(createRentalRequest));
router.get('/my-requests', asyncHandler(getMyRentalRequests));

export default router;
