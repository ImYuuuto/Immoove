import { z } from 'zod';

const id = z.coerce.number().int().positive();
export const reviewIdSchema = z.object({ id });
export const createReviewSchema = z.object({
  bookingId: id,
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(1).max(2000),
}).strict();
export const updateReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5).optional(),
  comment: z.string().trim().min(1).max(2000).optional(),
}).strict().refine(value => Object.keys(value).length > 0, 'At least one field is required');
