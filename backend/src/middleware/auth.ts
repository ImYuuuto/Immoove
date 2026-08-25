import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/errorHandler';
import { COOKIE_NAME } from '../controllers/authController';
import { query } from '../config/db';
export interface AuthUser {
  userId: number;
  role: string;
}
export type Permission =
  | 'analytics.read'
  | 'audit.read'
  | 'booking.manage'
  | 'content.moderate'
  | 'listing.manage'
  | 'moderation.metrics.read'
  | 'moderation.queue'
  | 'settings.manage'
  | 'user.manage';

const adminPermissions: Permission[] = [
  'analytics.read',
  'audit.read',
  'booking.manage',
  'content.moderate',
  'listing.manage',
  'moderation.metrics.read',
  'moderation.queue',
  'settings.manage',
  'user.manage',
];
const moderatorPermissions: Permission[] = [
  'content.moderate',
  'moderation.metrics.read',
  'moderation.queue',
];

export function permissionsForRole(role: string): Permission[] {
  if (['ADMIN', 'admin'].includes(role)) return adminPermissions;
  if (['moderator', 'staff'].includes(role)) return moderatorPermissions;
  return [];
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
export const auth: RequestHandler = async (req, _res, next) => {
  const authorization = req.header('authorization');
  const cookieToken = req.cookies?.[COOKIE_NAME];
  const secret = process.env.JWT_SECRET;
  const bearerToken = authorization?.startsWith('Bearer ')
    ? authorization.slice(7)
    : undefined;
  const token = bearerToken || cookieToken;
  if (token && secret) {
    try {
      const payload = jwt.verify(token, secret, {
        issuer: 'sidi-bouzid-api',
        audience: 'sidi-bouzid-web',
      });
      if (
        typeof payload === 'object' &&
        Number.isInteger(payload.userId) &&
        Number.isInteger(payload.sessionVersion) &&
        typeof payload.role === 'string' &&
        roles.includes(payload.role)
      ) {
        const result = await query<{ session_version: number; role: string; account_status?: string }>(
          'SELECT session_version, role, account_status FROM users WHERE user_id = $1',
          [payload.userId],
        );
        const user = result.rows[0];
        if (
          user &&
          user.account_status !== 'suspended' &&
          user.session_version === payload.sessionVersion &&
          user.role === payload.role
        ) {
          req.user = { userId: payload.userId as number, role: payload.role };
          req.authenticationSource = bearerToken ? 'bearer' : 'cookie';
        }
      }
    } catch (error) {
      if (!(error instanceof jwt.JsonWebTokenError)) return next(error);
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
    if (req.user) req.authenticationSource = 'development';
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

export const requirePermission =
  (permission: Permission): RequestHandler =>
  (req, _res, next) =>
    req.user && permissionsForRole(req.user.role).includes(permission)
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
      authenticationSource?: 'bearer' | 'cookie' | 'development';
    }
  }
}
