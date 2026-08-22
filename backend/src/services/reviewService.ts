// src/services/reviewService.ts
import { prisma } from "../config/db.js";

export class ReviewService {
  static async createReview(clientId: number, data: { bookingId: number; rating: number; comment?: string }) {
    const { bookingId, rating, comment } = data;

    const booking = await prisma.booking.findFirst({
      where: { bookingId, clientId },
    });

    if (!booking) throw new Error("BOOKING_NOT_FOUND");
    if (booking.status !== "confirmed" && booking.status !== "completed") {
      throw new Error("BOOKING_NOT_ELIGIBLE");
    }

    return prisma.review.create({
      data: {
        bookingId,
        rating,
        comment: comment ?? null,
      },
    });
  }

  static async getListingReviews(listingId: number) {
    return prisma.review.findMany({
      where: { booking: { listingId } },
      include: {
        booking: {
          select: {
            client: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}