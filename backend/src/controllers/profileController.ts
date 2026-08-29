import { RequestHandler } from 'express';
import { COOKIE_NAME } from './authController';
import { ProfileService } from '../services/profileService';
import { clearCsrfToken } from '../middleware/csrf';
import { updateProfileSchema } from '../validators/profileValidators';

const isProduction = process.env.NODE_ENV === 'production';
const cookieSecure = process.env.COOKIE_SECURE
  ? process.env.COOKIE_SECURE === 'true'
  : isProduction;

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
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: 'lax',
      path: '/',
    });
    clearCsrfToken(res);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
