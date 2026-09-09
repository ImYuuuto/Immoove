import { Router } from 'express';
import * as controller from '../controllers/legalController';

const router = Router();

//Get terms and conditions
router.get('/terms', controller.terms);

//Get privacy policy
router.get('/privacy', controller.privacy);

//take a record of the acceptence of the previous
router.post('/terms/accept', controller.acceptTerms);
export default router;
