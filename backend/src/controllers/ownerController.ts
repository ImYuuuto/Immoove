import { RequestHandler } from 'express';
import { OwnerDashboardService } from '../services/ownerDashboardService';

export const dashboard: RequestHandler = async (req, res, next) => {
  try {
    res.json(await OwnerDashboardService.get(req.user!.userId));
  } catch (error) {
    next(error);
  }
};
