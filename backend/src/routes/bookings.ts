import { Router } from 'express';
import * as controller from '../controllers/bookingController';
import { auth, requireAuth, requireRoles } from '../middleware/auth';

const router = Router();

/**
 * This middleware can identify the current user from the request,
 * but the route-specific `requireAuth` middleware below determines
 * whether authentication is actually required for that endpoint.
 */
router.use(auth);

//Get the bookings belonging to the user
router.get('/', requireAuth, controller.list);
//get a specific booking
router.get('/:id', requireAuth, controller.get);
//create a booking
router.post('/', requireAuth, controller.create);
//Update a specific booking
router.patch('/:id', requireAuth, controller.update);
// Delete a booking.
// Only users with the ADMIN role are allowed to perform this action.
router.delete('/:id', requireRoles('ADMIN'), controller.remove);


export default router;
