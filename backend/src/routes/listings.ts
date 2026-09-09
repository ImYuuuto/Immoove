import { Router } from 'express';
import * as controller from '../controllers/listingController';
import { auth, requireAdmin, requireAuth } from '../middleware/auth';
import { listingImagesUpload } from '../middleware/listingUpload';
const router = Router();

/**
 * Run the authentication middleware for every listing request.
 *
 * `auth` identifies the current user when authentication information
 * is available, while routes that require authentication use `requireAuth`.
 */
router.use(auth);

//get the list of available listings
router.get('/', controller.list);
//get the listings belonged to the auth User (might be needed to DELETE)
router.get('/mine', requireAuth, controller.mine);
//get specific listing
router.get('/:id', controller.get);

/**
 *  Only administrators are allowed to do the rest of the operations .
 */
//create a new Listing
router.post('/', requireAdmin, controller.create);

/**
 * The listingImagesUpload handles the images before
 *  passing it to the controller
 */

router.post(
  '/:id/images',
  requireAdmin,
  listingImagesUpload,
  controller.uploadImages,
);
//............................
router.put('/:id/images/order', requireAdmin, controller.reorderImages);
//Add time where listing is unavailable
router.post('/:id/availability', requireAdmin, controller.addAvailabilityBlock);
//Remove availability block from a listing
router.delete(
  '/:id/availability/:blockId',
  requireAdmin,
  controller.removeAvailabilityBlock,
);
//change infos about existing listing
router.patch('/:id', requireAdmin, controller.update);
//set status active/inactive of a listing 
router.put('/:id/status', requireAdmin, controller.setStatus);
//Delete an existing listing
router.delete('/:id', requireAdmin, controller.remove);

export default router;
