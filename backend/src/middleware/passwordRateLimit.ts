import { Request } from 'express';
import rateLimit from 'express-rate-limit';

/**
 * Read a rate-limit setting from the environment and make sure
 * it is a positive safe integer.
 *
 * If the environment variable is missing, the provided fallback
 * value is used instead.
 */
function positiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value || fallback);
  if (!Number.isSafeInteger(parsed) || parsed <= 0)
    throw new Error('Password rate-limit settings must be positive integers');
  return parsed;
}

// Time window used for password-related requests.
// Default: 15 minutes.
const windowMs = positiveInteger(
  process.env.PASSWORD_RATE_LIMIT_WINDOW_MS,
  15 * 60 * 1000,
);
// Maximum number of failed password attempts allowed in the window.
const limit = positiveInteger(process.env.PASSWORD_RATE_LIMIT_MAX, 5);

const options = {
  windowMs,
  limit,
  skip: () =>
    process.env.NODE_ENV !== 'production' ||
    process.env.DISABLE_RATE_LIMITS === 'true',
  standardHeaders: true,
  legacyHeaders: false,
  // Only count unsuccessful requests.
  skipSuccessfulRequests: true,
  message: {
    error: { message: 'Too many password attempts. Try again later' },
  },
};

/**
 * The user ID allows the account-based limiter to track
 * attempts independently of the client's IP address.
 */
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
