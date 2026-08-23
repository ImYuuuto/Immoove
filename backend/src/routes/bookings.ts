import { Router } from 'express';
import * as controller from '../controllers/bookingController';
import { auth, requireAuth } from '../middleware/auth';
const router = Router();
router.use(auth);
router.get('/', requireAuth, controller.list);
router.post('/', requireAuth, controller.create);
export default router;
