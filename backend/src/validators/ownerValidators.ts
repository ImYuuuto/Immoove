import { z } from 'zod';

const optionalEmail = z.union([z.literal(''), z.string().trim().email().max(255)]).transform(value => value || undefined);
const optionalCoordinate = z.union([z.literal(''), z.coerce.number()]).transform(value => value === '' ? undefined : value);
export const ownerPropertySchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  nationalIdCode: z.string().trim().min(3).max(50),
  phone: z.string().trim().min(3).max(50),
  email: optionalEmail.optional(),
  propertyTypeId: z.coerce.number().int().positive(),
  areaId: z.coerce.number().int().positive(),
  title: z.string().trim().min(1).max(200),
  nightlyPrice: z.coerce.number().positive(),
  contractNumber: z.string().trim().min(1).max(100),
  locationText: z.string().trim().min(1).max(500),
  mapUrl: z.union([z.literal(''), z.string().trim().url().max(2000)]).transform(value => value || undefined).optional(),
  latitude: optionalCoordinate.optional().refine(value => value === undefined || (value >= -90 && value <= 90), 'Invalid latitude'),
  longitude: optionalCoordinate.optional().refine(value => value === undefined || (value >= -180 && value <= 180), 'Invalid longitude'),
});
export const ownerQuerySchema = z.object({ search: z.string().trim().max(200).optional(), page: z.coerce.number().int().positive().default(1), limit: z.coerce.number().int().positive().max(100).default(20) });
export const ownerIdSchema = z.object({ id: z.coerce.number().int().positive() });
