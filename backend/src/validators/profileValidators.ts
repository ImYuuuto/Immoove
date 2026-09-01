import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
});

export const updateContactSchema = z
  .object({
    email: z.string().trim().email().max(255).optional(),
    phone: z
      .string()
      .trim()
      .regex(/^(?:\+212|0)[5-7]\d{8}$/, 'Enter a valid Moroccan phone number')
      .optional(),
    currentPassword: z.string().min(1).max(128),
  })
  .refine((value) => value.email !== undefined || value.phone !== undefined, {
    message: 'Email or phone is required',
  });

export const deactivateProfileSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  confirmation: z.literal('DELETE'),
});
