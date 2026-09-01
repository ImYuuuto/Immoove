import { Router } from 'express';
import * as controller from '../controllers/userController';
import { auth, requireRoles } from '../middleware/auth';
const router = Router();
router.use(auth, requireRoles('ADMIN'));
router.get('/', controller.list);
router.get('/:id', controller.get);
router.patch('/:id/status', controller.setStatus);
export default router;
