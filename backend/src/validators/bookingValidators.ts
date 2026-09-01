import { z } from 'zod';

export const bookingQuerySchema = z.object({
  state: z.enum(['all', 'upcoming', 'current', 'past', 'cancelled']).default('all'),
  cityId: z.coerce.number().int().positive().optional(),
  status: z
    .enum(['pending', 'processing', 'confirmed', 'cancelled', 'completed', 'rejected', 'refunded'])
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(12),
});
