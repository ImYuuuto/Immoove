import { z } from 'zod';

export const registerSchema = z.object({
  first_name: z.string().trim().min(1).max(100),
  last_name: z.string().trim().min(1).max(100),
  email: z
    .string()
    .trim()
    .email()
    .max(255)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(12).max(128),
  phone: z.string().trim().max(50).optional(),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'Terms of Use must be accepted' }),
  }),
  language: z.enum(['en', 'fr', 'ar']),
}).strict();

export const legalConsentSchema = z.object({
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'Terms of Use must be accepted' }),
  }),
  language: z.enum(['en', 'fr', 'ar']),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(255)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: z.string().min(12).max(128),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from the current password',
    path: ['newPassword'],
  });
