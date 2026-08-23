export {};

declare global {
  namespace Express {
    interface Request {
      userId?: number;
      userRole?: "client" | "provider" | "moderator" | "admin";
    }
  }
}
