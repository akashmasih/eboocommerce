import { Router } from 'express';
import { cartController } from '../controllers/cartController';

const router = Router();
router.get('/:userId', cartController.get);
router.post('/add', cartController.add);
router.post('/update', cartController.update);
router.post('/remove', cartController.remove);

export default router;
