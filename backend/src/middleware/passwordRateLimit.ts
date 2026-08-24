import { Request } from 'express';
import rateLimit from 'express-rate-limit';

function positiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value || fallback);
  if (!Number.isSafeInteger(parsed) || parsed <= 0)
    throw new Error('Password rate-limit settings must be positive integers');
  return parsed;
}

const windowMs = positiveInteger(
  process.env.PASSWORD_RATE_LIMIT_WINDOW_MS,
  15 * 60 * 1000,
);
const limit = positiveInteger(process.env.PASSWORD_RATE_LIMIT_MAX, 5);
const options = {
  windowMs,
  limit,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    error: { message: 'Too many password attempts. Try again later' },
  },
};

export function passwordAccountKey(req: Request) {
  return `account:${req.user!.userId}`;
}

// Separate stores ensure an attacker must stay below both the source-IP limit
// and the per-account limit.
export const passwordIpRateLimit = rateLimit(options);
export const passwordAccountRateLimit = rateLimit({
  ...options,
  keyGenerator: passwordAccountKey,
});
