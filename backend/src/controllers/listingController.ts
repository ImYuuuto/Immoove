import { RequestHandler } from 'express';
import { ListingService } from '../services/listingService';
import {
  createListingSchema,
  listingIdSchema,
  listingQuerySchema,
  statusSchema,
  updateListingSchema,
} from '../validators/listingValidators';
import { AppError } from '../utils/errorHandler';
const parse = <T>(
  schema: { parse: (value: unknown) => T },
  value: unknown,
): T => schema.parse(value);
export const list: RequestHandler = async (req, res, next) => {
  try {
    res.json(
      await ListingService.findAll({
        ...parse(listingQuerySchema, req.query),
        publicOnly:
          !req.user ||
          req.user.role !== 'ADMIN',
      }),
    );
  } catch (error) {
    next(error);
  }
};
export const mine: RequestHandler = async (req, res, next) => {
  try {
    res.json({ items: await ListingService.findMine(req.user!.userId) });
  } catch (error) {
    next(error);
  }
};
export const get: RequestHandler = async (req, res, next) => {
  try {
    const listing = await ListingService.findById(
      parse(listingIdSchema, req.params).id,
    );
    if (!listing) throw new AppError(404, 'Listing not found');
    const staff =
      req.user &&
      req.user.role === 'ADMIN';
    const owner =
      req.user?.role === 'OWNER' && req.user.userId === listing.providerId;
    if (
      (!listing.isActive || listing.status !== 'approved') &&
      !staff &&
      !owner
    )
      throw new AppError(404, 'Listing not found');
    res.json({ item: listing });
  } catch (error) {
    next(error);
  }
};
export const create: RequestHandler = async (req, res, next) => {
  try {
    const data = parse(createListingSchema, req.body);
    const listing = await ListingService.create({
      ...data,
      providerId: req.user!.userId,
    });
    res.status(201).json({ item: listing });
  } catch (error) {
    next(error);
  }
};
export const update: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const listing = await ListingService.update(
      parse(listingIdSchema, req.params).id,
      req.user.userId,
      req.user.role,
      parse(updateListingSchema, req.body),
    );
    res.json({ item: listing });
  } catch (error) {
    next(error);
  }
};
export const setStatus: RequestHandler = async (req, res, next) => {
  try {
    const body = parse(statusSchema, req.body);
    const item = await ListingService.setStatus(
      parse(listingIdSchema, req.params).id,
      req.user!.userId,
      body.status,
      body.reason,
    );
    res.json({ item });
  } catch (error) {
    next(error);
  }
};
export const remove: RequestHandler = async (req, res, next) => {
  try {
    await ListingService.delete(
      parse(listingIdSchema, req.params).id,
      req.user!.userId,
      req.user!.role,
    );
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
