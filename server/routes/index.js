import { Router } from 'express';
import authRoutes from './authRoutes.js';
import healthRoutes from './healthRoutes.js';
import ownerRoutes from './ownerRoutes.js';
import propertyRoutes from './propertyRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/health', healthRoutes);
router.use('/owner', ownerRoutes);
router.use('/properties', propertyRoutes);

export default router;
