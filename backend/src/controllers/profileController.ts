import { RequestHandler } from 'express';
import { clearAccessCookies } from './authController';
import { ProfileService } from '../services/profileService';
import { clearCsrfToken } from '../middleware/csrf';
import { storeAvatar } from '../middleware/avatarUpload';
import { AppError } from '../utils/errorHandler';
import {
  deactivateProfileSchema,
  updateContactSchema,
  updateProfileSchema,
} from '../validators/profileValidators';

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

export const summary: RequestHandler = async (req, res, next) => {
  try {
    res.json({ summary: await ProfileService.summary(req.user!.userId) });
  } catch (error) {
    next(error);
  }
};

export const updateAvatar: RequestHandler = async (req, res, next) => {
  try {
    if (!req.file) throw new AppError(400, 'Choose a profile photo');
    const avatarUrl = await storeAvatar(req.user!.userId, req.file);
    res.json({ user: await ProfileService.updateAvatar(req.user!.userId, avatarUrl) });
  } catch (error) {
    next(error);
  }
};

export const updateContact: RequestHandler = async (req, res, next) => {
  try {
    const data = updateContactSchema.parse(req.body);
    res.json({ user: await ProfileService.updateContact(req.user!.userId, data) });
  } catch (error) {
    next(error);
  }
};

export const remove: RequestHandler = async (req, res, next) => {
  try {
    const data = deactivateProfileSchema.parse(req.body);
    await ProfileService.deactivate(req.user!.userId, data.currentPassword);
    clearAccessCookies(res);
    clearCsrfToken(res);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
