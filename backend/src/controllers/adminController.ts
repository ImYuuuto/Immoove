import { RequestHandler } from 'express';
import { AdminApprovalService, AdminDashboardService } from '../services/adminService';
import { analyticsQuerySchema, auditQuerySchema, bookingModerationSchema, moderationCaseSchema, moderationDecisionSchema, moderationQueueSchema } from '../validators/adminValidators';

export const overview: RequestHandler = async (req, res, next) => {
  try { res.json(await AdminDashboardService.overview(analyticsQuerySchema.parse(req.query).days)); }
  catch (error) { next(error); }
};
export const audit: RequestHandler = async (req, res, next) => {
  try { res.json(await AdminDashboardService.audit(auditQuerySchema.parse(req.query))); }
  catch (error) { next(error); }
};
export const queue: RequestHandler = async (req, res, next) => {
  try { res.json(await AdminApprovalService.queue(req.user!.userId, moderationQueueSchema.parse(req.query))); }
  catch (error) { next(error); }
};
export const claim: RequestHandler = async (req, res, next) => {
  try { res.json({ item: await AdminApprovalService.claim(moderationCaseSchema.parse(req.params).id, req.user!.userId) }); }
  catch (error) { next(error); }
};
export const decide: RequestHandler = async (req, res, next) => {
  try { res.json({ item: await AdminApprovalService.decide(moderationCaseSchema.parse(req.params).id, req.user!.userId, req.user!.role, moderationDecisionSchema.parse(req.body)) }); }
  catch (error) { next(error); }
};
export const reviewBooking: RequestHandler = async (req, res, next) => {
  try { const data=bookingModerationSchema.parse(req.body); res.json({item:await AdminApprovalService.reviewBooking(moderationCaseSchema.parse(req.params).id,req.user!.userId,req.user!.role,data.status,data.reason)}); }
  catch(error){ next(error); }
};
export const history: RequestHandler = async (req, res, next) => {
  try { res.json({ items: await AdminApprovalService.history(req.user!.userId) }); }
  catch (error) { next(error); }
};
export const adminMetrics: RequestHandler = async (req, res, next) => {
  try { res.json(await AdminApprovalService.metrics(req.user!.userId)); }
  catch (error) { next(error); }
};
