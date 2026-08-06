import { Router } from 'express';
import adminRoutes from './adminRoutes.js';
import authRoutes from './authRoutes.js';
import healthRoutes from './healthRoutes.js';
import ownerRoutes from './ownerRoutes.js';
import propertyRoutes from './propertyRoutes.js';
import rentalRequestRoutes from './rentalRequestRoutes.js';

const router = Router();

router.use('/admin', adminRoutes);
router.use('/auth', authRoutes);
router.use('/health', healthRoutes);
router.use('/owner', ownerRoutes);
router.use('/properties', propertyRoutes);
router.use('/rental-requests', rentalRequestRoutes);

export default router;
