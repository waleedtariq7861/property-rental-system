import { Router } from 'express';
import {
  getProperties,
  getPropertyById,
} from '../controllers/propertyController.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(getProperties));
router.get('/:id', asyncHandler(getPropertyById));

export default router;
