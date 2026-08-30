import { Router } from 'express';
import * as controller from '../controllers/staffController';
import { auth, requireAdmin } from '../middleware/auth';

const admin = Router();
admin.use(auth, requireAdmin);
admin.get('/overview', controller.overview);
admin.get('/audit', controller.audit);
admin.get('/approvals', controller.queue);
admin.post('/approvals/:id/decision', controller.decide);
admin.patch('/bookings/:id/status', controller.moderateBooking);

export default admin;
