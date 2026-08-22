// src/controllers/reviewController.ts
import { Request, Response, NextFunction } from "express";
import { ReviewService } from "../services/reviewService.js";

export class ReviewController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const clientId = req.userId!;
      const review = await ReviewService.createReview(clientId, req.body);
      res.status(201).json(review);
    } catch (error: any) {
      if (error.message === "BOOKING_NOT_FOUND") {
        res.status(404).json({ error: "Booking not found" });
        return;
      }
      if (error.message === "BOOKING_NOT_ELIGIBLE") {
        res.status(400).json({ error: "You can only review confirmed or completed bookings" });
        return;
      }
      next(error);
    }
  }

  static async getByListing(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const listingId = Number(req.params.listingId);
      const reviews = await ReviewService.getListingReviews(listingId);
      res.json(reviews);
    } catch (error) {
      next(error);
    }
  }
}