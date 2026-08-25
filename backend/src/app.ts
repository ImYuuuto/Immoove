import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import path from 'node:path';
import routes from './routes';
import { auth } from './middleware/auth';
import { csrfProtection } from './middleware/csrf';
import { errorHandler, notFound } from './utils/errorHandler';
export const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const rateLimitsDisabled =
  !isProduction || process.env.DISABLE_RATE_LIMITS === 'true';
const rateLimitWindowMs =
  Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const rateLimitMax =
  Number(process.env.RATE_LIMIT_MAX) || (isProduction ? 100 : 10000);
const requestBodyLimitBytes = Number(
  process.env.REQUEST_BODY_LIMIT_BYTES || 100 * 1024,
);
if (
  !Number.isSafeInteger(requestBodyLimitBytes) ||
  requestBodyLimitBytes <= 0
) {
  throw new Error('REQUEST_BODY_LIMIT_BYTES must be a positive integer');
}
const allowedOrigins = new Set(
  (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
);
app.disable('x-powered-by');
app.use(helmet());
app.use(compression());
app.use(
  '/uploads',
  express.static(path.resolve(process.cwd(), 'upload'), {
    fallthrough: false,
    immutable: isProduction,
    maxAge: isProduction ? '30d' : 0,
  }),
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error('Origin is not allowed'));
    },
    credentials: true,
  }),
);
app.use(
  rateLimit({
    windowMs: rateLimitWindowMs,
    limit: rateLimitMax,
    skip: () => rateLimitsDisabled,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
app.use(express.json({ limit: requestBodyLimitBytes }));
app.use(cookieParser());
app.use((req, _res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const origin = req.header('origin');
    if (origin && !allowedOrigins.has(origin))
      return next(new Error('Origin is not allowed'));
  }
  next();
});
app.use(auth);
app.use(csrfProtection);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/v1', routes);
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);
