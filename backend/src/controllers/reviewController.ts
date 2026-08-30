import { RequestHandler } from 'express';
import { ReviewService } from '../services/reviewService';
import { createReviewSchema, reviewIdSchema, updateReviewSchema } from '../validators/reviewValidators';

export const mine: RequestHandler = async (req,res,next) => {
  try { res.json({items:await ReviewService.mine(req.user!.userId)}); } catch(error){ next(error); }
};
export const create: RequestHandler = async (req,res,next) => {
  try { res.status(201).json({item:await ReviewService.create(req.user!.userId,createReviewSchema.parse(req.body))}); } catch(error){ next(error); }
};
export const update: RequestHandler = async (req,res,next) => {
  try { res.json({item:await ReviewService.update(reviewIdSchema.parse(req.params).id,req.user!.userId,req.user!.role,updateReviewSchema.parse(req.body))}); } catch(error){ next(error); }
};
export const remove: RequestHandler = async (req,res,next) => {
  try { await ReviewService.delete(reviewIdSchema.parse(req.params).id,req.user!.userId,req.user!.role); res.status(204).send(); } catch(error){ next(error); }
};
