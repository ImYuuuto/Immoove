import { Router } from 'express';
import { dashboard } from '../controllers/ownerController';
import { auth, requireRoles } from '../middleware/auth';

const router = Router();
router.use(auth, requireRoles('OWNER'));
router.get('/dashboard', dashboard);
export default router;
