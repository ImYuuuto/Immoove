import { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}
export const notFound: RequestHandler = (_req, _res, next) =>
  next(new AppError(404, 'Route not found'));
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (!(error instanceof ZodError) && !(error instanceof AppError)) {
    console.error('Unhandled request error:', error);
  }
  const validation = error instanceof ZodError;
  const status = validation
    ? 400
    : error instanceof AppError
      ? error.statusCode
      : 500;
  res.status(status).json({
    error: {
      message: validation
        ? 'Validation failed'
        : status === 500
          ? 'Internal server error'
          : error.message,
      ...(validation
        ? { details: error.flatten() }
        : error.details
          ? { details: error.details }
          : {}),
    },
  });
};
