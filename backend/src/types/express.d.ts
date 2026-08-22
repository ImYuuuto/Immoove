// src/types/express.d.ts
export {};

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}