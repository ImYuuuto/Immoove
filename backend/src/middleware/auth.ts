import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/errorHandler';
import { COOKIE_NAME } from '../controllers/authController';
import { JWT_AUDIENCE, JWT_ISSUER } from '../config/authBrand';
import { query } from '../config/db';

/**
 * Information about the authenticated user that is attached to
 * the Express request.
 */
export interface AuthUser {
  userId: number;
  role: string;
  requiresTermsAcceptance: boolean;
}
//Roles accepted by the APP
const roles = ['CLIENT', 'ADMIN'];

/**
 * This middleware does not reject unauthenticated requests by itself.
 * Instead, it attempts to identify the user and attaches `req.user`
 * when valid credentials are provided.
 *
 * Routes that require authentication use `requireAuth`, `requireAdmin`,
 * or `requireRoles` after this middleware.
 */
export const auth: RequestHandler = async (req, _res, next) => {
  //checking for JWT in the request header
  const authorization = req.header('authorization');

  //checking for JWT in the request cookie
  const cookieToken = req.cookies?.[COOKIE_NAME];

  const secret = process.env.JWT_SECRET;

  //Bearer format is mandatory
  const bearerToken = authorization?.startsWith('Bearer ')
    ? authorization.slice(7)
    : undefined;

  const token = bearerToken || cookieToken;
  if (token && secret) {
    try {
      /**
       * Verify the JWT signature and also check its issuer and audience.
       *
       * This prevents accepting a correctly signed token that was
       * created for a different issuer or intended application.
       */
      const payload = jwt.verify(token, secret, {
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      });

      //validation of the payload
      if (
        typeof payload === 'object' &&
        Number.isInteger(payload.userId) &&
        Number.isInteger(payload.sessionVersion) &&
        typeof payload.role === 'string' &&
        roles.includes(payload.role)
      ) {
        /**
         * Fetch the current user state from the database.
         *
         * The database check allows the application to detect changes
         * made after the JWT was issued
         * - account suspension
         * - role changes
         * - session invalidation
         */
        const result = await query<{
          session_version: number;
          role: string;
          account_status?: string;
          requires_terms_acceptance: boolean;
        }>(
          `SELECT u.session_version, u.role, u.account_status,
           EXISTS (
             SELECT 1 FROM legal_documents d
             WHERE d.document_type='terms' AND d.is_current=true AND
              d.requires_reacceptance=true
               AND NOT EXISTS (
                 SELECT 1 FROM user_legal_consents c
                 WHERE c.user_id=u.user_id AND c.document_type=d.document_type
                   AND c.document_version=d.version
               )
           ) AS requires_terms_acceptance
           FROM users u WHERE u.user_id = ?`,
          [payload.userId],
        );
        const user = result.rows[0];

        /**
         * Accept the JWT only when it still matches the current
         * database state of the user.
         *
         * The checks ensure that:
         * - the user still exists
         * - the account is not suspended
         * - the session version has not been invalidated
         * - the user's current role matches the JWT role
         */
        if (
          user &&
          user.account_status !== 'suspended' &&
          user.session_version === payload.sessionVersion &&
          user.role === payload.role
        ) {
          //add the Auth User to the request
          req.user = {
            userId: payload.userId as number,
            role: payload.role,
            requiresTermsAcceptance: Boolean(user.requires_terms_acceptance),
          };
          //record how the user got authentificated
          req.authenticationSource = bearerToken ? 'bearer' : 'cookie';
        }
      }
    } catch (error) {
      /**
       * Invalid or expired JWTs are treated as unauthenticated.
       *
       * Other unexpected errors are forwarded to
       * /utils/errorHandler.
       */
      if (!(error instanceof jwt.JsonWebTokenError)) return next(error);
      /* Protected routes reject invalid credentials. */
    }
  }
  //Authentication shortcut for developement only (disabled in production)
  else if (
    process.env.ALLOW_DEV_AUTH === 'true' &&
    process.env.NODE_ENV !== 'production'
  ) {
    const id = Number(req.header('x-user-id'));
    const role = req.header('x-user-role');
    /**
     * Only accept the development identity when the ID and role
     * have valid values.
     */
    req.user =
      Number.isInteger(id) && id > 0 && role && roles.includes(role)
        ? { userId: id, role, requiresTermsAcceptance: false }
        : undefined;
    if (req.user) req.authenticationSource = 'development';
  }

  /**
   * Continue to the next middleware.
   *
   * `auth` itself does not require authentication. Middleware such as
   * `requireAuth` decides whether an unauthenticated request is allowed.
   */

  next();
};

//Require the request to be from an authenticated user.
export const requireAuth: RequestHandler = (req, _res, next) => {
  !req.user
    ? next(new AppError(401, 'Authentication required'))
    : req.user.requiresTermsAcceptance
      ? next(new AppError(428, 'Current Terms of Use must be accepted'))
      : next();
};
/**
 * Require the authenticated user to have the ADMIN role.
 *
 * A user who has not authenticated receives 401.
 * An authenticated non-admin user receives 403.
 * A user who must accept the current Terms of Use receives 428.
 */
export const requireAdmin: RequestHandler = (req, _res, next) => {
  req.user?.requiresTermsAcceptance
    ? next(new AppError(428, 'Current Terms of Use must be accepted'))
    : req.user?.role === 'ADMIN'
      ? next()
      : next(
          new AppError(
            req.user ? 403 : 401,
            req.user
              ? 'Administrator access required'
              : 'Authentication required',
          ),
        );
};

//maybe to be deleted 
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
