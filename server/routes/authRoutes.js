import { Router } from 'express';
import { loginUser, registerUser } from '../controllers/authController.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = Router();

router.post('/register', asyncHandler(registerUser));
router.post('/login', asyncHandler(loginUser));

export default router;
