import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as controller from '../controllers/authController';
import { requireAuth } from '../middleware/auth';

const router = Router();
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many authentication attempts' } },
});
router.post('/register', authRateLimit, controller.register);
router.post('/login', authRateLimit, controller.login);
router.post('/logout', controller.logout);
router.patch('/password', requireAuth, controller.changePassword);
router.get('/session', controller.session);
router.get('/csrf-token', controller.csrfToken);
export default router;
