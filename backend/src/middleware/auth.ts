import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/errorHandler';
import { COOKIE_NAME } from '../controllers/authController';
import { query } from '../config/db';
export interface AuthUser {
  userId: number;
  role: string;
  requiresTermsAcceptance: boolean;
}
const roles = ['CLIENT', 'OWNER', 'ADMIN'];
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
        const result = await query<{ session_version: number; role: string; account_status?: string; requires_terms_acceptance: boolean }>(
          `SELECT u.session_version, u.role, u.account_status,
           EXISTS (
             SELECT 1 FROM legal_documents d
             WHERE d.document_type='terms' AND d.is_current=true AND d.requires_reacceptance=true
               AND NOT EXISTS (
                 SELECT 1 FROM user_legal_consents c
                 WHERE c.user_id=u.user_id AND c.document_type=d.document_type
                   AND c.document_version=d.version
               )
           ) AS requires_terms_acceptance
           FROM users u WHERE u.user_id = $1`,
          [payload.userId],
        );
        const user = result.rows[0];
        if (
          user &&
          user.account_status !== 'suspended' &&
          user.session_version === payload.sessionVersion &&
          user.role === payload.role
        ) {
          req.user = {
            userId: payload.userId as number,
            role: payload.role,
            requiresTermsAcceptance: Boolean(user.requires_terms_acceptance),
          };
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
        ? { userId: id, role, requiresTermsAcceptance: false }
        : undefined;
    if (req.user) req.authenticationSource = 'development';
  }
  next();
};
export const requireAuth: RequestHandler = (req, _res, next) =>
  !req.user
    ? next(new AppError(401, 'Authentication required'))
    : req.user.requiresTermsAcceptance
      ? next(new AppError(428, 'Current Terms of Use must be accepted'))
      : next();
export const requireAdmin: RequestHandler = (req, _res, next) =>
  req.user?.requiresTermsAcceptance
    ? next(new AppError(428, 'Current Terms of Use must be accepted'))
    : req.user?.role === 'ADMIN'
    ? next()
    : next(
        new AppError(
          req.user ? 403 : 401,
          req.user ? 'Administrator access required' : 'Authentication required',
        ),
      );
export const requireRoles =
  (...allowedRoles: string[]): RequestHandler =>
  (req, _res, next) =>
    req.user?.requiresTermsAcceptance
      ? next(new AppError(428, 'Current Terms of Use must be accepted'))
      : req.user && allowedRoles.includes(req.user.role)
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
