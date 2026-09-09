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

//All routes below require Authentification
router.use(requireAuth);

/**
 * Prevent browsers and intermediate caches from storing profile data.
 *
 * Profile information is private and should always be fetched again
 * instead of being served from a cache.
 */
router.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store, private');
  res.set('Pragma', 'no-cache');
  next();
});

//Get the profile informations
router.get('/', controller.get);
//get a summary of user infos
router.get('/summary', controller.summary);
//Change the avatar
router.post(
  '/avatar',
  profileChangeIpRateLimit,
  profileChangeAccountRateLimit,
  avatarUpload,
  controller.updateAvatar,
);
//update the user infos
router.patch(
  '/',
  profileChangeIpRateLimit,
  profileChangeAccountRateLimit,
  controller.update,
);
//update the contact infos of the user
router.patch(
  '/contact',
  profileChangeIpRateLimit,
  profileChangeAccountRateLimit,
  passwordIpRateLimit,
  passwordAccountRateLimit,
  controller.updateContact,
);
//delete the account
router.delete(
  '/',
  passwordIpRateLimit,
  passwordAccountRateLimit,
  controller.remove,
);

export default router;
