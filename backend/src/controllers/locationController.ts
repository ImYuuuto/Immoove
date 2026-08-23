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

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { cityName, country } = req.body;
      if (!cityName || !country) {
        res.status(400).json({ error: "cityName and country are required" });
        return;
      }
      res.status(201).json(await LocationService.create({ cityName, country }));
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const locationId = Number(req.params.id);
      res.json(await LocationService.update(locationId, req.body));
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const locationId = Number(req.params.id);
      await LocationService.delete(locationId);
      res.json({ message: "Location deleted" });
    } catch (error) {
      next(error);
    }
  }
}
