import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/userService.js";
import { AUTH_COOKIE_NAME } from "../config/auth.js";

export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies[AUTH_COOKIE_NAME];
  if (!token) {
    next();
    return;
  }

  const payload = UserService.verifyToken(token);
  if (!payload) {
    next();
    return;
  }

  const user = await UserService.findById(payload.userId);
  if (user) {
    req.userId = user.userId;
    req.userRole = user.role;
  }
  next();
}
