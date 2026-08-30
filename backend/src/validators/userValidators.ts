import { z } from 'zod';

export const userIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const userQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const userRoleSchema = z.object({
  role: z.enum(['CLIENT', 'OWNER', 'ADMIN']),
});

export const userStatusSchema = z.object({
  status: z.enum(['active', 'suspended']),
  reason: z.string().trim().min(2).max(1000).optional(),
});
