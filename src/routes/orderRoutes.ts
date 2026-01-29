import { Router } from 'express';
import { orderController } from '../controllers/orderController';

const router = Router();
router.post('/checkout', orderController.checkout);
router.get('/:id', orderController.get);
router.get('/user/:userId', orderController.listByUser);
router.post('/:id/cancel', orderController.cancel);

export default router;
