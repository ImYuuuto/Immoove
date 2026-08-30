import { RequestHandler } from 'express';
import { PlatformService } from '../services/platformService';
import { AppError } from '../utils/errorHandler';
import {
  announcementReviewSchema,
  announcementSchema,
  blogQuerySchema,
  favoriteIdSchema,
  searchSchema,
} from '../validators/platformValidators';
import { ListingService } from '../services/listingService';
import { deleteUploadUrls, processListingUploads } from '../middleware/listingUpload';

export const search: RequestHandler = async (req, res, next) => {
  try {
    const data = searchSchema.parse(req.query);
    res.json(
      await ListingService.search({
        checkIn: data.check_in,
        checkOut: data.check_out,
        guests: data.guests,
        minPrice: data.min_price,
        maxPrice: data.max_price,
        serviceType: data.service_type,
        page: data.page,
        limit: data.limit,
      }),
    );
  } catch (error) {
    next(error);
  }
};
export const featured: RequestHandler = async (_req, res, next) => {
  try {
    res.json(await ListingService.featured());
  } catch (error) {
    next(error);
  }
};
export const createAnnouncement: RequestHandler = async (req, res, next) => {
  let imageUrls: string[] = [];
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    imageUrls = await processListingUploads((req.files as Express.Multer.File[] | undefined) || []);
    if (!imageUrls.length) throw new AppError(400, 'At least one listing image is required');
    const data = announcementSchema.parse(req.body);
    const item = await PlatformService.createAnnouncement({
      requesterId: req.user.userId,
      categorySlug: data.categorySlug,
      title: data.title,
      description: data.description,
      locationName: data.locationName, mapUrl: data.mapUrl, basePrice: data.basePrice,
      pricingUnit: data.pricingUnit, guestCapacity: data.guestCapacity,
      contactName: data.contactName, contactPhone: data.contactPhone, contactEmail: data.contactEmail,
      imageUrls,
    });
    res.status(201).json({ item });
  } catch (error) {
    await deleteUploadUrls(imageUrls).catch(() => undefined);
    next(error);
  }
};
export const announcements: RequestHandler = async (_req, res, next) => {
  try {
    res.json({ items: await PlatformService.listAnnouncements() });
  } catch (error) {
    next(error);
  }
};
export const reviewAnnouncement: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const data = announcementReviewSchema.parse(req.body);
    const item = await PlatformService.reviewAnnouncement(
      Number(req.params.id),
      req.user.userId,
      req.user.role,
      data.status,
      data.reason,
    );
    res.json({ item });
  } catch (error) {
    next(error);
  }
};
export const posts: RequestHandler = async (req, res, next) => {
  try {
    const data = blogQuerySchema.parse(req.query);
    res.json(await PlatformService.listPosts(data));
  } catch (error) {
    next(error);
  }
};
export const favorites: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    res.json({ items: await PlatformService.getFavorites(req.user.userId) });
  } catch (error) {
    next(error);
  }
};
export const toggleFavorite: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    const data = favoriteIdSchema.parse(req.params);
    res.json(
      await PlatformService.toggleFavorite(req.user.userId, data.listingId),
    );
  } catch (error) {
    next(error);
  }
};
