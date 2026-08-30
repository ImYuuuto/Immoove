import { Router } from 'express';
import * as controller from '../controllers/platformController';
import { auth, requireAuth, requireRoles } from '../middleware/auth';
import { listingImagesUpload } from '../middleware/listingUpload';
const router = Router();
router.get('/listings/search', controller.search);
router.get('/listings/featured', controller.featured);
router.post(
  '/announcements/request',
  auth,
  requireAuth,
  listingImagesUpload,
  controller.createAnnouncement,
);
router.get(
  '/announcements',
  auth,
  requireRoles('ADMIN'),
  controller.announcements,
);
router.patch(
  '/announcements/:id',
  auth,
  requireRoles('ADMIN'),
  controller.reviewAnnouncement,
);
router.get('/blog/posts', controller.posts);
router.get('/favorites', auth, requireAuth, controller.favorites);
router.post(
  '/favorites/:listingId/toggle',
  auth,
  requireAuth,
  controller.toggleFavorite,
);
export default router;
