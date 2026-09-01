import { Router } from 'express';
import * as controller from '../controllers/profileController';
import { requireAuth } from '../middleware/auth';
import { avatarUpload } from '../middleware/avatarUpload';
import {
  passwordAccountRateLimit,
  passwordIpRateLimit,
} from '../middleware/passwordRateLimit';
import {
  profileChangeAccountRateLimit,
  profileChangeIpRateLimit,
} from '../middleware/profileChangeRateLimit';

const router = Router();
router.use(requireAuth);
router.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store, private');
  res.set('Pragma', 'no-cache');
  next();
});
router.get('/', controller.get);
router.get('/summary', controller.summary);
router.post(
  '/avatar',
  profileChangeIpRateLimit,
  profileChangeAccountRateLimit,
  avatarUpload,
  controller.updateAvatar,
);
router.patch(
  '/',
  profileChangeIpRateLimit,
  profileChangeAccountRateLimit,
  controller.update,
);
router.patch(
  '/contact',
  profileChangeIpRateLimit,
  profileChangeAccountRateLimit,
  passwordIpRateLimit,
  passwordAccountRateLimit,
  controller.updateContact,
);
router.delete(
  '/',
  passwordIpRateLimit,
  passwordAccountRateLimit,
  controller.remove,
);

export default router;
