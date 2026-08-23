import { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { loginSchema, registerSchema } from '../validators/authValidators';
import { AuthService } from '../services/authService';
import { AppError } from '../utils/errorHandler';

export const COOKIE_NAME = 'sidibouzid_access';
const isProduction = process.env.NODE_ENV === 'production';

function issueCookie(
  res: Parameters<RequestHandler>[1],
  user: { userId: number; role: string },
) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new AppError(500, 'JWT_SECRET is not configured');
  const token = jwt.sign({ userId: user.userId, role: user.role }, secret, {
    expiresIn: '15m',
    issuer: 'sidi-bouzid-api',
    audience: 'sidi-bouzid-web',
  });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000,
    path: '/',
  });
}

export const register: RequestHandler = async (req, res, next) => {
  try {
    const user = await AuthService.register(registerSchema.parse(req.body));
    issueCookie(res, user);
    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
};
export const login: RequestHandler = async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await AuthService.authenticate(data.email, data.password);
    issueCookie(res, user);
    res.json({ user });
  } catch (error) {
    next(error);
  }
};
export const logout: RequestHandler = (_req, res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
  });
  res.status(204).send();
};
export const session: RequestHandler = (req, res, next) => {
  try {
    if (!req.user) throw new AppError(401, 'Authentication required');
    res.json({ user: req.user });
  } catch (error) {
    next(error);
  }
};
