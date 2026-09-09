import { Router } from 'express';
import * as controller from '../controllers/reviewController';
import { auth, requireAuth } from '../middleware/auth';

const router=Router();
router.use(auth,requireAuth);

//get the reviews of the current listing
router.get('/',controller.mine);
//create a review
router.post('/',controller.create);
//update review
router.patch('/:id',controller.update);
//remove review
router.delete('/:id',controller.remove);
export default router;
