import { randomBytes, timingSafeEqual } from 'node:crypto';
import { RequestHandler, Response } from 'express';
import { AppError } from '../utils/errorHandler';

export const CSRF_COOKIE_NAME = 'sidibouzid_csrf';
export const CSRF_HEADER_NAME = 'x-csrf-token';

const isProduction = process.env.NODE_ENV === 'production';
const stateChangingMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const csrfCookieOptions = {
  httpOnly: false,
  secure: isProduction,
  sameSite: 'lax' as const,
  path: '/',
};

export function issueCsrfToken(res: Response): string {
  const token = randomBytes(32).toString('base64url');
  res.cookie(CSRF_COOKIE_NAME, token, csrfCookieOptions);
  return token;
}

export function clearCsrfToken(res: Response): void {
  res.clearCookie(CSRF_COOKIE_NAME, csrfCookieOptions);
}

function tokensMatch(cookieToken: unknown, headerToken: unknown): boolean {
  if (typeof cookieToken !== 'string' || typeof headerToken !== 'string')
    return false;

  const cookieBuffer = Buffer.from(cookieToken);
  const headerBuffer = Buffer.from(headerToken);
  return (
    cookieBuffer.length === headerBuffer.length &&
    timingSafeEqual(cookieBuffer, headerBuffer)
  );
}

export const csrfProtection: RequestHandler = (req, _res, next) => {
  if (
    !stateChangingMethods.has(req.method) ||
    req.authenticationSource !== 'cookie'
  ) {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.header(CSRF_HEADER_NAME);
  return tokensMatch(cookieToken, headerToken)
    ? next()
    : next(new AppError(403, 'Invalid or missing CSRF token'));
};
