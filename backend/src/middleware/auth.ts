import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/errorHandler';
import { COOKIE_NAME } from '../controllers/authController';
export interface AuthUser {
  userId: number;
  role: string;
}
const roles = [
  'CLIENT',
  'HOST',
  'ADMIN',
  'user',
  'provider',
  'staff',
  'moderator',
  'admin',
];
export const auth: RequestHandler = (req, _res, next) => {
  const authorization = req.header('authorization');
  const cookieToken = req.cookies?.[COOKIE_NAME];
  const secret = process.env.JWT_SECRET;
  const token = authorization?.startsWith('Bearer ')
    ? authorization.slice(7)
    : cookieToken;
  if (token && secret) {
    try {
      const payload = jwt.verify(token, secret, {
        issuer: 'sidi-bouzid-api',
        audience: 'sidi-bouzid-web',
      });
      if (
        typeof payload === 'object' &&
        Number.isInteger(payload.userId) &&
        typeof payload.role === 'string' &&
        roles.includes(payload.role)
      ) {
        req.user = { userId: payload.userId as number, role: payload.role };
      }
    } catch {
      /* Protected routes reject invalid credentials. */
    }
  } else if (
    process.env.ALLOW_DEV_AUTH === 'true' &&
    process.env.NODE_ENV !== 'production'
  ) {
    const id = Number(req.header('x-user-id'));
    const role = req.header('x-user-role');
    req.user =
      Number.isInteger(id) && id > 0 && role && roles.includes(role)
        ? { userId: id, role }
        : undefined;
  }
  next();
};
export const requireAuth: RequestHandler = (req, _res, next) =>
  req.user ? next() : next(new AppError(401, 'Authentication required'));
export const requireStaff: RequestHandler = (req, _res, next) =>
  req.user && ['ADMIN', 'admin', 'moderator', 'staff'].includes(req.user.role)
    ? next()
    : next(
        new AppError(
          req.user ? 403 : 401,
          req.user ? 'Staff access required' : 'Authentication required',
        ),
      );
export const requireRoles =
  (...allowedRoles: string[]): RequestHandler =>
  (req, _res, next) =>
    req.user && allowedRoles.includes(req.user.role)
      ? next()
      : next(
          new AppError(
            req.user ? 403 : 401,
            req.user ? 'Insufficient permissions' : 'Authentication required',
          ),
        );
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
