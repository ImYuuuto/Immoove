import { Request, Response, NextFunction } from "express";
import { SpecializedListingService } from "../services/specializedListingService.js";

export class SpecializedListingController {
  static async addPropertyDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const listingId = Number(req.params.listingId);
      const userId = req.userId!;
      const property = await SpecializedListingService.createPropertyDetail(listingId, userId, req.body);
      res.status(201).json(property);
    } catch (error: any) {
      if (error.message === "NOT_FOUND") { res.status(404).json({ error: "Listing not found" }); return; }
      if (error.message === "UNAUTHORIZED") { res.status(403).json({ error: "Forbidden: You do not own this listing" }); return; }
      next(error);
    }
  }

  static async addVehicleDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const listingId = Number(req.params.listingId);
      const userId = req.userId!;
      const vehicle = await SpecializedListingService.createVehicleDetail(listingId, userId, req.body);
      res.status(201).json(vehicle);
    } catch (error: any) {
      if (error.message === "NOT_FOUND") { res.status(404).json({ error: "Listing not found" }); return; }
      if (error.message === "UNAUTHORIZED") { res.status(403).json({ error: "Forbidden: You do not own this listing" }); return; }
      next(error);
    }
  }

  static async addServiceDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const listingId = Number(req.params.listingId);
      const userId = req.userId!;
      const service = await SpecializedListingService.createServiceDetail(listingId, userId, req.body);
      res.status(201).json(service);
    } catch (error: any) {
      if (error.message === "NOT_FOUND") { res.status(404).json({ error: "Listing not found" }); return; }
      if (error.message === "UNAUTHORIZED") { res.status(403).json({ error: "Forbidden: You do not own this listing" }); return; }
      next(error);
    }
  }
}