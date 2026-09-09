import { Router } from 'express';
import * as controller from '../controllers/platformController';
import { auth, requireAuth, requireRoles } from '../middleware/auth';
import { listingImagesUpload } from '../middleware/listingUpload';
const router = Router();

// Search listings
router.get('/listings/search', controller.search);
//filter the properties with a selected option
router.get('/property-discovery/options', controller.propertyDiscoveryOptions);
//Get listings marked as featured
router.get('/listings/featured', controller.featured);

//to be deleted
router.post(
  '/announcements/request',
  auth,
  requireAuth,
  listingImagesUpload,
  controller.createAnnouncement,
);
//To be deleted 
router.get(
  '/announcements',
  auth,
  requireRoles('ADMIN'),
  controller.announcements,
);
//to be deleted maybe 
router.patch(
  '/announcements/:id',
  auth,
  requireRoles('ADMIN'),
  controller.reviewAnnouncement,
);
//get the favorite for the user
router.get('/favorites', auth, requireAuth, controller.favorites);
//add or remove  a post as favorite 
router.post(
  '/favorites/:listingId/toggle',
  auth,
  requireAuth,
  controller.toggleFavorite,
);

export default router;
