import { Request, Response, NextFunction } from "express";
import { ListingService } from "../services/listingService.js";

export class ListingController {
  static async getAll(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const page = Number(req.query.page as string) || 1;
      const limit = Number(req.query.limit as string) || 10;
      const categoryId = req.query.categoryId
        ? Number(req.query.categoryId)
        : undefined;
      const locationId = req.query.locationId
        ? Number(req.query.locationId)
        : undefined;
      const search = req.query.search ? String(req.query.search) : "";
      const params: any = { page, limit, search };
      if (req.query.categoryId)
        params.categoryId = Number(req.query.categoryId);
      if (req.query.locationId)
        params.locationId = Number(req.query.locationId);

      const result = await ListingService.findAll(params);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const listingId = Number(req.params.id);
      const listing = await ListingService.findById(listingId);

      if (!listing) {
        res.status(404).json({ error: "Listing not found" });
        return;
      }

      res.json(listing);
    } catch (error) {
      next(error);
    }
  }

  static async create(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const providerId = req.userId!;
      const listing = await ListingService.create({ ...req.body, providerId });
      res.status(201).json(listing);
    } catch (error) {
      next(error);
    }
  }

  static async delete(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const listingId = Number(req.params.id);
      const userId = req.userId!;

      await ListingService.delete(listingId, userId);
      res.status(200).json({ message: "Listing deleted successfully" });
    } catch (error: any) {
      if (error.message === "NOT_FOUND") {
        res.status(404).json({ error: "Listing not found" });
        return;
      }
      if (error.message === "UNAUTHORIZED") {
        res
          .status(403)
          .json({ error: "Forbidden: You do not own this listing" });
        return;
      }
      next(error);
    }
  }
}
