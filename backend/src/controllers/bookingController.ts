import { RequestHandler } from 'express';
import { BookingService } from '../services/bookingService';
import { AppError } from '../utils/errorHandler';
import { createBookingSchema, updateBookingSchema } from '../validators/listingValidators';
import { userIdSchema } from '../validators/userValidators';
export const list: RequestHandler = async (req, res, next) => {
  try {
    res.json({
      items: await BookingService.findAll(
        ['ADMIN', 'admin'].includes(req.user?.role || '')
          ? undefined
          : req.user?.userId,
      ),
    });
  } catch (error) {
    next(error);
  }
};
export const get: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const item = await BookingService.findById(userIdSchema.parse(req.params).id);
    if (!item) throw new AppError(404, 'Booking not found');
    if (!['ADMIN', 'admin'].includes(req.user.role) && item.userId !== req.user.userId)
      throw new AppError(403, 'You cannot view this booking');
    res.json({ item });
  } catch (error) { next(error); }
};
export const create: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const data = createBookingSchema.parse(req.body);
    const item = await BookingService.create({
      ...data,
      userId: ['ADMIN', 'admin'].includes(req.user.role) && data.userId ? data.userId : req.user.userId,
    });
    res.status(201).json({ item });
  } catch (error) {
    next(error);
  }
};
export const update: RequestHandler = async (req, res, next) => {
  try {
    const item = await BookingService.update(userIdSchema.parse(req.params).id, updateBookingSchema.parse(req.body));
    res.json({ item });
  } catch (error) { next(error); }
};
export const remove: RequestHandler = async (req, res, next) => {
  try {
    await BookingService.delete(userIdSchema.parse(req.params).id);
    res.status(204).send();
  } catch (error) { next(error); }
};
