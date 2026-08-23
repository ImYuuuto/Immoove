import { Request, Response, NextFunction } from "express";
import { ListingStatus } from "@prisma/client";
import { ListingService } from "../services/listingService.js";

function isStaff(role?: string) {
  return role === "admin" || role === "moderator";
}

export class ListingController {
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? Number(req.query.page) : 1;
      const limit = req.query.limit ? Number(req.query.limit) : 12;
      const search = req.query.search ? String(req.query.search) : "";
      const slug = req.query.slug ? String(req.query.slug) : undefined;
      const mine = req.query.mine === "true";

      const staff = isStaff(req.userRole);
      const params: Parameters<typeof ListingService.findAll>[0] = {
        page,
        limit,
        search,
        slug,
        includeAllStatuses: staff && req.query.all === "true",
      };

      if (req.query.categoryId && !isNaN(Number(req.query.categoryId))) {
        params.categoryId = Number(req.query.categoryId);
      }
      if (req.query.locationId && !isNaN(Number(req.query.locationId))) {
        params.locationId = Number(req.query.locationId);
      }
      if (staff && req.query.status) {
        params.status = String(req.query.status) as ListingStatus;
        params.includeAllStatuses = true;
      }
      if (mine && req.userId) {
        params.providerId = req.userId;
        params.includeAllStatuses = true;
      }

      const result = await ListingService.findAll(params);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const listingId = Number(req.params.id);
      const listing = await ListingService.findById(listingId, {
        staff: isStaff(req.userRole),
        userId: req.userId,
      });

      if (!listing) {
        res.status(404).json({ error: "Listing not found" });
        return;
      }

      res.json(listing);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const providerId = req.userId!;
      const listing = await ListingService.create({
        ...req.body,
        providerId,
        autoApprove: isStaff(req.userRole),
      });
      res.status(201).json(listing);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const listingId = Number(req.params.id);
      const listing = await ListingService.update(
        listingId,
        req.userId!,
        req.userRole || "client",
        req.body,
      );
      res.json(listing);
    } catch (error: any) {
      if (error.message === "NOT_FOUND") {
        res.status(404).json({ error: "Listing not found" });
        return;
      }
      if (error.message === "UNAUTHORIZED") {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
      next(error);
    }
  }

  static async moderate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const listingId = Number(req.params.id);
      const { status, reason } = req.body as { status: ListingStatus; reason?: string };
      const allowed: ListingStatus[] = ["pending", "approved", "rejected", "archived"];
      if (!allowed.includes(status)) {
        res.status(400).json({ error: "Invalid status" });
        return;
      }
      const listing = await ListingService.setStatus(listingId, req.userId!, status, reason);
      res.json(listing);
    } catch (error: any) {
      if (error.message === "NOT_FOUND") {
        res.status(404).json({ error: "Listing not found" });
        return;
      }
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const listingId = Number(req.params.id);
      await ListingService.delete(listingId, req.userId!, req.userRole);
      res.status(200).json({ message: "Listing deleted successfully" });
    } catch (error: any) {
      if (error.message === "NOT_FOUND") {
        res.status(404).json({ error: "Listing not found" });
        return;
      }
      if (error.message === "UNAUTHORIZED") {
        res.status(403).json({ error: "Forbidden: You do not own this listing" });
        return;
      }
      if (error.code === "P2003") {
        res.status(409).json({
          error: "This listing cannot be deleted because it has booking history",
        });
        return;
      }
      next(error);
    }
  }
}
