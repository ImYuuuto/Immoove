import { Router } from 'express';
import * as controller from '../controllers/userController';
import { auth, requireRoles } from '../middleware/auth';
const router = Router();

//ALL the routes need ADMIN authentification
router.use(auth, requireRoles('ADMIN'));
//get all users
router.get('/', controller.list);
//get specific user
router.get('/:id', controller.get);
//suspend or remove suspention from a user
router.patch('/:id/status', controller.setStatus);

export default router;
