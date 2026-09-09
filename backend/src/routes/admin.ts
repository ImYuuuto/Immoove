import { Router } from 'express';
import * as controller from '../controllers/adminController';
import { auth, requireAdmin } from '../middleware/auth';

//Creating a seperate router reserved for admin related endpoints
const admin = Router();

/**
 * Protect every route in this router.
 *
 * `auth` verifies that the user is authenticated.
 * `requireAdmin` verifies that the authenticated user has
 *  admin privileges.
 */
admin.use(auth, requireAdmin);

//All the routes are defined here
admin.get('/overview', controller.overview);
admin.get('/audit', controller.audit);
admin.get('/approvals', controller.queue);
admin.post('/approvals/:id/decision', controller.decide);
admin.patch('/bookings/:id/status', controller.reviewBooking);

export default admin;
