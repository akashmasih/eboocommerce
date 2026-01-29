import { Router } from 'express';
import { healthController } from '../controllers/healthController';
import authRoutes from './authRoutes';
import productRoutes from './productRoutes';
import categoryRoutes from './categoryRoutes';
import uploadRoutes from './uploadRoutes';
import reviewRoutes from './reviewRoutes';
import cartRoutes from './cartRoutes';
import orderRoutes from './orderRoutes';

const router = Router();
router.get('/health', healthController.status);
router.get('/health/ready', healthController.readiness);
router.get('/health/live', healthController.liveness);
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/upload', uploadRoutes);
router.use('/reviews', reviewRoutes);
router.use('/carts', cartRoutes);
router.use('/orders', orderRoutes);

export default router;
