import { z } from 'zod';

export const categorySlugSchema = z.object({
  slug: z.enum([
    'housing',
    'services',
    'hobbies-and-activities',
    'renting-cars',
  ]),
});

export const categoryListingsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
