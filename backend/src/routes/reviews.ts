import { Router } from 'express';
import * as controller from '../controllers/reviewController';
import { auth, requireAuth } from '../middleware/auth';

const router=Router();
router.use(auth,requireAuth);
router.get('/',controller.mine);
router.post('/',controller.create);
router.patch('/:id',controller.update);
router.delete('/:id',controller.remove);
export default router;
