import { Request } from 'express';
import rateLimit from 'express-rate-limit';

const windowMs = Number(process.env.PROFILE_CHANGE_RATE_LIMIT_WINDOW_MS || 60 * 60 * 1000);
const limit = Number(process.env.PROFILE_CHANGE_RATE_LIMIT_MAX || 5);

if (!Number.isSafeInteger(windowMs) || windowMs <= 0 || !Number.isSafeInteger(limit) || limit <= 0) {
  throw new Error('Profile change rate-limit settings must be positive integers');
}

const common = {
  windowMs,
  limit,
  skip: () => process.env.NODE_ENV === 'test',
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many profile changes. Try again later' } },
};

export const profileChangeIpRateLimit = rateLimit(common);
export const profileChangeAccountRateLimit = rateLimit({
  ...common,
  keyGenerator: (req: Request) => `profile:${req.user!.userId}`,
});
