import { Router } from 'express';
import * as controller from '../controllers/staffController';
import { auth, requirePermission } from '../middleware/auth';

const admin = Router();
admin.use(auth);
admin.get('/overview', requirePermission('analytics.read'), controller.overview);
admin.get('/audit', requirePermission('audit.read'), controller.audit);

const moderation = Router();
moderation.use(auth);
moderation.get('/queue', requirePermission('moderation.queue'), controller.queue);
moderation.post('/cases/:id/claim', requirePermission('moderation.queue'), controller.claim);
moderation.post('/cases/:id/decision', requirePermission('content.moderate'), controller.decide);
moderation.get('/history', requirePermission('moderation.metrics.read'), controller.history);
moderation.get('/metrics', requirePermission('moderation.metrics.read'), controller.moderatorMetrics);

export { admin, moderation };
