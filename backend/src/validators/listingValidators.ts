import { z } from 'zod';
const id = z.coerce.number().int().positive();
export const listingIdSchema = z.object({ id });
export const listingQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  categoryId: id.optional(),
  locationId: id.optional(),
  providerId: id.optional(),
  search: z.string().trim().min(1).optional(),
  slug: z.string().trim().min(1).optional(),
  status: z.enum(['approved', 'pending', 'rejected']).optional(),
  featured: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
});
const common = {
  categoryId: id,
  locationId: id.optional(),
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000).optional(),
  basePrice: z.coerce.number().nonnegative(),
  pricingUnit: z.string().max(30).optional(),
  contactName: z.string().max(150).optional(),
  contactPhone: z.string().max(50).optional(),
  contactEmail: z.string().email().optional(),
  coverImageUrl: z.string().url().nullable().optional(),
  imageUrls: z.array(z.string().url()).max(50).optional(),
  featureIds: z.array(id).max(50).optional(),
  categoryIds: z.array(id).min(1).max(20).optional(),
  serviceType: z
    .enum(['VACATION_RENTAL', 'CAR_RENTAL', 'RESTAURANT_CAFE', 'ACTIVITY'])
    .optional(),
  guestCapacity: z.coerce.number().int().positive().max(1000).optional(),
};
export const createListingSchema = z.object({
  ...common,
  providerId: id.optional(),
});
export const updateListingSchema = z
  .object(common)
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    'At least one field is required',
  );
export const statusSchema = z.object({
  status: z.enum(['approved', 'pending', 'rejected']),
  reason: z.string().max(1000).optional(),
});
export const createBookingSchema = z
  .object({
    listingId: id,
    userId: id.optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    email: z.string().trim().email().max(255),
    phone: z.string().trim().min(3).max(50),
  })
  .refine((value) => value.endDate > value.startDate, {
    message: 'endDate must be after startDate',
    path: ['endDate'],
  });
export const updateBookingSchema = z
  .object({
    listingId: id.optional(),
    userId: id.optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    status: z.enum(['confirmed', 'cancelled', 'completed', 'refunded']).optional(),
    paymentStatus: z.enum(['unpaid', 'pending', 'paid', 'refunded']).optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    'At least one field is required',
  );
