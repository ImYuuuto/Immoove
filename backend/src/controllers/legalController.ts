import { RequestHandler } from 'express';
import { z } from 'zod';
import { LegalService } from '../services/legalService';
import { legalConsentSchema } from '../validators/authValidators';
import { AppError } from '../utils/errorHandler';

const languageSchema = z.object({ language: z.enum(['en', 'fr', 'ar']).default('en') });

export const terms: RequestHandler = async (req, res, next) => {
  try { res.json({ document: await LegalService.current('terms', languageSchema.parse(req.query).language) }); }
  catch (error) { next(error); }
};

export const privacy: RequestHandler = async (req, res, next) => {
  try { res.json({ document: await LegalService.current('privacy', languageSchema.parse(req.query).language) }); }
  catch (error) { next(error); }
};

export const acceptTerms: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const data = legalConsentSchema.parse(req.body);
    res.json({ consent: await LegalService.acceptTerms(req.user.userId, data.language) });
  } catch (error) { next(error); }
};
