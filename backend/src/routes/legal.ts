import { Router } from 'express';
import * as controller from '../controllers/legalController';

const router = Router();
router.get('/terms', controller.terms);
router.get('/privacy', controller.privacy);
router.post('/terms/accept', controller.acceptTerms);
export default router;
