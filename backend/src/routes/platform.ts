import { Router } from 'express';
import * as controller from '../controllers/platformController';
import { auth, requireAuth, requireRoles } from '../middleware/auth';
const router = Router();
router.get('/listings/search', controller.search);
router.get('/listings/featured', controller.featured);
router.post(
  '/announcements/request',
  auth,
  requireAuth,
  controller.createAnnouncement,
);
router.get(
  '/announcements',
  auth,
  requireRoles('ADMIN', 'admin'),
  controller.announcements,
);
router.patch(
  '/announcements/:id',
  auth,
  requireRoles('ADMIN', 'admin'),
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
