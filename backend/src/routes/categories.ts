import { Router } from 'express';
import * as controller from '../controllers/categoryController';

const router = Router();
router.get('/', controller.list);
router.get('/:slug/listings', controller.listings);

export default router;
