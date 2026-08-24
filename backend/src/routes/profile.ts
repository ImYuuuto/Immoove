import { Router } from 'express';
import * as controller from '../controllers/profileController';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);
router.get('/', controller.get);
router.patch('/', controller.update);
router.delete('/', controller.remove);

export default router;
