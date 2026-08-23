import { RequestHandler } from 'express';
import { BookingService } from '../services/bookingService';
import { AppError } from '../utils/errorHandler';
import { createBookingSchema } from '../validators/listingValidators';
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
export const create: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const data = createBookingSchema.parse(req.body);
    const item = await BookingService.create({
      ...data,
      userId: req.user.userId,
    });
    res.status(201).json({ item });
  } catch (error) {
    next(error);
  }
};
