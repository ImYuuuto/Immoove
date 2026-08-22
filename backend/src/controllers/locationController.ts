import { Request, Response, NextFunction } from "express";
import { LocationService } from "../services/locationService.js";

export class LocationController {
  static async getAll(
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      res.json(await LocationService.getAll());
    } catch (error) {
      next(error);
    }
  }
}
