import { Request, Response } from "express";
import { UserService } from "../services/userService.js";
import { UserError } from "../errors/userError.js";
import { toPublicUser } from "../utils/userMapper.js";
import { AUTH_COOKIE_NAME, authCookieOptions } from "../config/auth.js";

export class UserController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const user = await UserService.register(req.body);
      const token = UserService.generateToken(user.userId);

      res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions);
      res.status(201).json(toPublicUser(user));
    } catch (error) {
      if (error instanceof UserError) {
        res.status(error.statusCode).json(
          error.fields ? { error: error.message, fields: error.fields } : { error: error.message }
        );
        return;
      }
      console.error("Register Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const user = await UserService.login(email, password);
      const token = UserService.generateToken(user.userId);

      res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions);
      res.status(200).json(toPublicUser(user));
    } catch (error) {
      if (error instanceof UserError) {
        res.status(error.statusCode).json(
          error.fields ? { error: error.message, fields: error.fields } : { error: error.message }
        );
        return;
      }
      console.error("Login Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static logout(_req: Request, res: Response): void {
    res.clearCookie(AUTH_COOKIE_NAME);
    res.status(200).json({ message: "Successfully logged out" });
  }

  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = await UserService.getProfile(req.userId!);
      res.status(200).json(toPublicUser(user));
    } catch (error) {
      if (error instanceof UserError) {
        res.status(error.statusCode).json(
          error.fields ? { error: error.message, fields: error.fields } : { error: error.message }
        );
        return;
      }
      console.error("Get Profile Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
