import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/db.js";

export class SavedListingController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const saved = await prisma.savedListing.findMany({
        where: { userId: req.userId! },
        orderBy: { createdAt: "desc" },
        include: {
          listing: {
            include: {
              category: true,
              location: true,
              images: { orderBy: { sortOrder: "asc" } },
            },
          },
        },
      });
      res.json(saved.map((s) => s.listing));
    } catch (error) {
      next(error);
    }
  }

  static async save(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const listingId = Number(req.params.listingId);
      const saved = await prisma.savedListing.upsert({
        where: { userId_listingId: { userId: req.userId!, listingId } },
        update: {},
        create: { userId: req.userId!, listingId },
      });
      res.status(201).json(saved);
    } catch (error) {
      next(error);
    }
  }

  static async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const listingId = Number(req.params.listingId);
      await prisma.savedListing.deleteMany({
        where: { userId: req.userId!, listingId },
      });
      res.json({ message: "Removed" });
    } catch (error) {
      next(error);
    }
  }
}
