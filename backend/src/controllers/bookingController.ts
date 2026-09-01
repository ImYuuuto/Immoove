import { RequestHandler } from 'express';
import { BookingService } from '../services/bookingService';
import { AppError } from '../utils/errorHandler';
import { createBookingSchema, updateBookingSchema } from '../validators/listingValidators';
import { userIdSchema } from '../validators/userValidators';
import { bookingQuerySchema } from '../validators/bookingValidators';
export const list: RequestHandler = async (req, res, next) => {
  try {
    res.json(
      await BookingService.findAll(
        req.user?.role === 'ADMIN'
          ? undefined
          : req.user?.userId,
        bookingQuerySchema.parse(req.query),
      ),
    );
  } catch (error) {
    next(error);
  }
};
export const get: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const item = await BookingService.findById(userIdSchema.parse(req.params).id);
    if (!item) throw new AppError(404, 'Booking not found');
    if (req.user.role !== 'ADMIN' && item.userId !== req.user.userId)
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
      userId: req.user.role === 'ADMIN' && data.userId ? data.userId : req.user.userId,
    });
    res.status(201).json({ item });
  } catch (error) {
    next(error);
  }
};
export const update: RequestHandler = async (req, res, next) => {
  try {
    const item = await BookingService.update(
      userIdSchema.parse(req.params).id,
      req.user!.userId,
      req.user!.role,
      updateBookingSchema.parse(req.body),
    );
    res.json({ item });
  } catch (error) { next(error); }
};
export const remove: RequestHandler = async (req, res, next) => {
  try {
    await BookingService.delete(userIdSchema.parse(req.params).id, req.user!.role);
    res.status(204).send();
  } catch (error) { next(error); }
};
