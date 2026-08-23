import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/userService.js";
import { AUTH_COOKIE_NAME } from "../config/auth.js";

type Role = "client" | "provider" | "moderator" | "admin";

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies[AUTH_COOKIE_NAME];

  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const payload = UserService.verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  const user = await UserService.findById(payload.userId);
  if (!user) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  req.userId = user.userId;
  req.userRole = user.role;
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.userId || !req.userRole) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    if (!roles.includes(req.userRole)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}

export const requireStaff = [requireAuth, requireRole("moderator", "admin")];
export const requireAdmin = [requireAuth, requireRole("admin")];
