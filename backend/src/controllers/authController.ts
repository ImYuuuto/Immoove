import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
} from '../validators/authValidators';
import { AuthService } from '../services/authService';
import { AppError } from '../utils/errorHandler';
import { clearCsrfToken, issueCsrfToken } from '../middleware/csrf';
import {
  ACCESS_COOKIE_NAME,
  JWT_AUDIENCE,
  JWT_ISSUER,
} from '../config/authBrand';

export const COOKIE_NAME = ACCESS_COOKIE_NAME;
const isProduction = process.env.NODE_ENV === 'production';
const cookieSecure = process.env.COOKIE_SECURE
  ? process.env.COOKIE_SECURE === 'true'
  : isProduction;

function issueCookie(
  res: Parameters<RequestHandler>[1],
  user: { userId: number; role: string; sessionVersion: number },
) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new AppError(500, 'JWT_SECRET is not configured');
  const token = jwt.sign(
    {
      userId: user.userId,
      role: user.role,
      sessionVersion: user.sessionVersion,
    },
    secret,
    {
      expiresIn: '15m',
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    },
  );
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: cookieSecure,
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000,
    path: '/',
  });
}

export function clearAccessCookies(res: Parameters<RequestHandler>[1]) {
  for (const name of [COOKIE_NAME]) {
    res.clearCookie(name, {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: 'lax',
      path: '/',
    });
  }
}

export const register: RequestHandler = async (req, res, next) => {
  try {
    const user = await AuthService.register(registerSchema.parse(req.body));
    issueCookie(res, user);
    const csrfToken = issueCsrfToken(res);
    const { sessionVersion: _sessionVersion, ...publicUser } = user;
    res.status(201).json({ user: publicUser, csrfToken });
  } catch (error) {
    next(error);
  }
};
export const login: RequestHandler = async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await AuthService.authenticate(data.email, data.password);
    issueCookie(res, user);
    const csrfToken = issueCsrfToken(res);
    const { sessionVersion: _sessionVersion, ...publicUser } = user;
    res.json({ user: publicUser, csrfToken });
  } catch (error) {
    next(error);
  }
};
export const logout: RequestHandler = (_req, res) => {
  clearAccessCookies(res);
  clearCsrfToken(res);
  res.status(204).send();
};
export const changePassword: RequestHandler = async (req, res, next) => {
  try {
    const data = changePasswordSchema.parse(req.body);
    await AuthService.changePassword(
      req.user!.userId,
      data.currentPassword,
      data.newPassword,
    );
    clearAccessCookies(res);
    clearCsrfToken(res);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
export const csrfToken: RequestHandler = (_req, res) => {
  res.json({ csrfToken: issueCsrfToken(res) });
};
export const session: RequestHandler = (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    res.json({ user: req.user });
  } catch (error) {
    next(error);
  }
};
