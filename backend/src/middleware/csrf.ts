import { randomBytes, timingSafeEqual } from 'node:crypto';
import { RequestHandler, Response } from 'express';
import { AppError } from '../utils/errorHandler';

//name of CSRF cookie user in current version
export const CSRF_COOKIE_NAME = 'immoove_csrf';

//HTTP header client send the csrf token
export const CSRF_HEADER_NAME = 'x-csrf-token';

const isProduction = process.env.NODE_ENV === 'production';

// HTTPS cookies should normally be marked as Secure in production.
// COOKIE_SECURE can explicitly override this behavior.
const cookieSecure = process.env.COOKIE_SECURE
  ? process.env.COOKIE_SECURE === 'true'
  : isProduction;

// CSRF protection is only needed for requests that can modify state.
const stateChangingMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const csrfCookieOptions = {
  httpOnly: false,
  // Send the cookie only over HTTPS when secure cookies are enabled.
  secure: cookieSecure,
  // Restrict when the browser sends the cookie in cross-site requests.
  sameSite: 'lax' as const,
  // Make the cookie available throughout the application.
  path: '/',
};

//create and send a token to the client
export function issueCsrfToken(res: Response): string {
  const token = randomBytes(32).toString('base64url');
  res.cookie(CSRF_COOKIE_NAME, token, csrfCookieOptions);
  return token;
}

//delete oand remove Current CSRF cookie
export function clearCsrfToken(res: Response): void {
  res.clearCookie(CSRF_COOKIE_NAME, csrfCookieOptions);
}

function tokensMatch(cookieToken: unknown, headerToken: unknown): boolean {
  if (typeof cookieToken !== 'string' || typeof headerToken !== 'string') {
    return false;
  }

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

  //the CSRF token automatically send by the browser in cookie
  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];

  //the token supplied by the client in the HTTP header
  const headerToken = req.header(CSRF_HEADER_NAME);

  return tokensMatch(cookieToken, headerToken)
    ? next()
    : next(new AppError(403, 'Invalid or missing CSRF token'));
};
