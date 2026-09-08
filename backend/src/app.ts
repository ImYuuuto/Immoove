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

/**
 * Environment and security configuration
 */

//Rate limiting is disabled by default outside production.
// It can also be explicitly disabled with DISABLE_RATE_LIMITS=true.
const isProduction = process.env.NODE_ENV === 'production';
const rateLimitsDisabled =
  !isProduction || process.env.DISABLE_RATE_LIMITS === 'true';

// Maximum number of requests allowed from the same client IP
// during the configured time window.
const rateLimitWindowMs =
  Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const rateLimitMax =
  Number(process.env.RATE_LIMIT_MAX) || (isProduction ? 100 : 10000);

//Maximum size of incoming JSON request bodies
const requestBodyLimitBytes = Number(
  process.env.REQUEST_BODY_LIMIT_BYTES || 100 * 1024,
);

/**
 * Make sure the configured request body limit is a valid positive integer.
 * Failing early here prevents the application from starting with an invalid
 * security/performance configuration.
 */

if (
  !Number.isSafeInteger(requestBodyLimitBytes) ||
  requestBodyLimitBytes <= 0
) {
  throw new Error('REQUEST_BODY_LIMIT_BYTES must be a positive integer');
}

//List of origins that are allowed to make cross-origin requests

const allowedOrigins = new Set(
  (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
);

/**
 * Express middleware configuration
 */

// Do not expose the Express framework/version in the response headers
app.disable('x-powered-by');

//Add HTTP security headers
app.use(helmet());

//compressing the json before sending it for better performance
app.use(compression());

/**
 * Static file handling
 * Files inside the "upload" directory are exposed through the /uploads URL.
 */

app.use(
  '/uploads',
  express.static(path.resolve(process.cwd(), 'upload'), {
    // Return an error instead of passing a missing static file
    // request to the next middleware.
    fallthrough: false,
    immutable: false,
    maxAge: isProduction ? '7d' : 0,
    setHeaders: (res, filePath) => {
      // AVIF files may not always be detected correctly by the static
      // file middleware, so explicitly set their content type.
      if (path.extname(filePath).toLowerCase() === '.avif')
        res.setHeader('Content-Type', 'image/avif');
      if (
        isProduction &&
        filePath.includes(`${path.sep}listings${path.sep}requests${path.sep}`)
      )
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    },
  }),
);

/**
 * CORS
 * Controls which frontend origins are allowed to communicate with the API.
 * Credentials are enabled because the application uses cookies.
 */

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error('Origin is not allowed'));
    },
    credentials: true,
  }),
);

/**
 * Rate limitingreduce abuse such as excessive requests, brute-force attempts,
 * and basic denial-of-service/spam traffic.
 * 
    "Limits can be configured through ENV"
 */

app.use(
  rateLimit({
    windowMs: rateLimitWindowMs,
    limit: rateLimitMax,
    //disable outside production
    skip: () => rateLimitsDisabled,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

// The limit prevents clients from sending excessively large JSON payloads.
app.use(express.json({ limit: requestBodyLimitBytes }));

// Parse cookies and expose them through req.cookies.
app.use(cookieParser());
//
app.use((req, _res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const origin = req.header('origin');
    if (origin && !allowedOrigins.has(origin))
      return next(new Error('Origin is not allowed'));
  }
  next();
});
// Adds authentication information to the request and handles
app.use(auth);
// Protects state-changing requests against Cross-Site Request Forgery.
app.use(csrfProtection);
//for checking if the backend is working
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/v1', routes);
app.use('/api', routes);
/**
 * Error handling
 */

// Handles requests that do not match any registered route.
app.use(notFound);
app.use(errorHandler);
