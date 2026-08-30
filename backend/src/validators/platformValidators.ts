import { z } from 'zod';
const id = z.coerce.number().int().positive();
export const searchSchema = z.object({
  check_in: z.coerce.date().optional(), check_out: z.coerce.date().optional(),
  guests: z.coerce.number().int().positive().max(100).optional(),
  min_price: z.coerce.number().nonnegative().optional(), max_price: z.coerce.number().nonnegative().optional(),
  rental_term: z.enum(['short_term', 'long_term', 'both']).optional(),
  region_id: id.optional(), city_id: id.optional(), area_id: id.optional(),
  property_type: z.string().trim().regex(/^[a-z0-9-]+$/).max(60).optional(),
  bedrooms: z.coerce.number().int().nonnegative().max(100).optional(),
  bathrooms: z.coerce.number().int().nonnegative().max(100).optional(),
  amenities: z.string().regex(/^\d+(,\d+)*$/).optional(),
  min_rating: z.coerce.number().min(1).max(5).optional(),
  instant_available: z.enum(['true', 'false']).transform(value => value === 'true').optional(),
  page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().positive().max(100).default(20),
}).refine(value => !value.check_in || !value.check_out || value.check_out > value.check_in, { message: 'check_out must be after check_in', path: ['check_out'] }).refine(value => value.min_price === undefined || value.max_price === undefined || value.max_price >= value.min_price, { message: 'max_price must be greater than min_price', path: ['max_price'] });
export const announcementSchema = z.object({
  propertyTypeSlug: z.enum(['apartment', 'studio', 'villa']),
  rentalTerm: z.enum(['short_term', 'long_term', 'both']),
  title: z.string().trim().min(3).max(200), description: z.string().trim().min(20).max(5000),
  locationName: z.string().trim().min(2).max(300),
  mapUrl: z.string().url().max(2000).refine(value => {
    const host = new URL(value).hostname.toLowerCase();
    return value.startsWith('https://') && (host === 'maps.app.goo.gl' || host === 'goo.gl' || host === 'google.com' || host.endsWith('.google.com'));
  }, 'mapUrl must be an HTTPS Google Maps link'),
  basePrice: z.coerce.number().positive().max(10000000),
  pricingUnit: z.enum(['night', 'month']),
  guestCapacity: z.coerce.number().int().positive().max(1000).optional(),
  contactName: z.string().trim().min(2).max(150), contactPhone: z.string().trim().min(5).max(50),
  contactEmail: z.string().trim().email().max(320),
}).strict();
export const announcementReviewSchema = z.object({ status: z.enum(['APPROVED', 'REJECTED']), reason: z.string().trim().min(2).max(1000) });
export const favoriteIdSchema = z.object({ listingId: id });
