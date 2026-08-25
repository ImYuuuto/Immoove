import { z } from 'zod';

export const analyticsQuerySchema = z.object({
  days: z.coerce.number().int().min(7).max(365).default(30),
});

export const auditQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
  entityType: z.string().trim().max(80).optional(),
  actorId: z.coerce.number().int().positive().optional(),
});

export const moderationQueueSchema = z.object({
  scope: z.enum(['all', 'mine', 'unassigned']).default('all'),
  status: z.enum(['open', 'claimed', 'escalated']).optional(),
  entityType: z.enum(['listing', 'announcement']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
});

export const moderationCaseSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const moderationDecisionSchema = z.object({
  decision: z.enum(['approved', 'rejected', 'changes_requested', 'escalated']),
  reasonCode: z.string().trim().min(2).max(80),
  note: z.string().trim().max(2000).optional(),
});
