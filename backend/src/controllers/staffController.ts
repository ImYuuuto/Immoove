import { RequestHandler } from 'express';
import { AdminDashboardService, ModerationService } from '../services/staffService';
import { analyticsQuerySchema, auditQuerySchema, moderationCaseSchema, moderationDecisionSchema, moderationQueueSchema } from '../validators/staffValidators';

export const overview: RequestHandler = async (req, res, next) => {
  try { res.json(await AdminDashboardService.overview(analyticsQuerySchema.parse(req.query).days)); }
  catch (error) { next(error); }
};
export const audit: RequestHandler = async (req, res, next) => {
  try { res.json(await AdminDashboardService.audit(auditQuerySchema.parse(req.query))); }
  catch (error) { next(error); }
};
export const queue: RequestHandler = async (req, res, next) => {
  try { res.json(await ModerationService.queue(req.user!.userId, moderationQueueSchema.parse(req.query))); }
  catch (error) { next(error); }
};
export const claim: RequestHandler = async (req, res, next) => {
  try { res.json({ item: await ModerationService.claim(moderationCaseSchema.parse(req.params).id, req.user!.userId) }); }
  catch (error) { next(error); }
};
export const decide: RequestHandler = async (req, res, next) => {
  try { res.json({ item: await ModerationService.decide(moderationCaseSchema.parse(req.params).id, req.user!.userId, moderationDecisionSchema.parse(req.body)) }); }
  catch (error) { next(error); }
};
export const history: RequestHandler = async (req, res, next) => {
  try { res.json({ items: await ModerationService.history(req.user!.userId) }); }
  catch (error) { next(error); }
};
export const moderatorMetrics: RequestHandler = async (req, res, next) => {
  try { res.json(await ModerationService.metrics(req.user!.userId)); }
  catch (error) { next(error); }
};
