import { RequestHandler } from 'express';
import { clearAccessCookies } from './authController';
import { ProfileService } from '../services/profileService';
import { clearCsrfToken } from '../middleware/csrf';
import { updateProfileSchema } from '../validators/profileValidators';

export const get: RequestHandler = async (req, res, next) => {
  try {
    res.json({ user: await ProfileService.get(req.user!.userId) });
  } catch (error) {
    next(error);
  }
};

export const update: RequestHandler = async (req, res, next) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    const user = await ProfileService.update(
      req.user!.userId,
      data.firstName,
      data.lastName,
    );
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

export const remove: RequestHandler = async (req, res, next) => {
  try {
    await ProfileService.delete(req.user!.userId);
    clearAccessCookies(res);
    clearCsrfToken(res);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
