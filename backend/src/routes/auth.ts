import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as controller from '../controllers/authController';
import { requireAuth } from '../middleware/auth';
import {
  passwordAccountRateLimit,
  passwordIpRateLimit,
} from '../middleware/passwordRateLimit';

const router = Router();

/**
 * In production, an IP can make at most 10 requests within 15 minutes.
 * To reduce brute-force attempts against login and registration.
 *
 * Rate limiting is disabled outside production or when explicitly
 * disabled through the environment configuration.
 */

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skip: () =>
    process.env.NODE_ENV !== 'production' ||
    process.env.DISABLE_RATE_LIMITS === 'true',
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many authentication attempts' } },
});

//Register
router.post('/register', authRateLimit, controller.register);
//Login
router.post('/login', authRateLimit, controller.login);
//Logout
router.post('/logout', controller.logout);

/**
 * `requireAuth` ensures the user is logged in.
 * The two password rate limiters provide additional protection:
 * - passwordIpRateLimit limits attempts from the same IP.
 * - passwordAccountRateLimit limits attempts against the same account.
 */

router.patch(
  '/password',
  requireAuth,
  passwordIpRateLimit,
  passwordAccountRateLimit,
  controller.changePassword,
);

// Return information about the current authentication session.
router.get('/session', controller.session);
//Generate csrf-token
router.get('/csrf-token', controller.csrfToken);

export default router;
