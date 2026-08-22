import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/userService.js";
import { AUTH_COOKIE_NAME } from "../config/auth.js";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
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

  req.userId = payload.userId;
  next();
}
