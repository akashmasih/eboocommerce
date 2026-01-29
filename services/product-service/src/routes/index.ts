import { Router } from 'express';
import { healthController } from '../controllers/healthController';
import productRoutes from './productRoutes';
import categoryRoutes from './categoryRoutes';
import uploadRoutes from './uploadRoutes';

const router = Router();
router.get('/health', healthController.status);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/upload', uploadRoutes);

export default router;
