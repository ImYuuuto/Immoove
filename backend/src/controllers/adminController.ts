import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/db.js";
import { BookingService, BookingError } from "../services/bookingService.js";
import { toPublicUser } from "../utils/userMapper.js";

export class AdminController {
  static async overview(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [
        pendingReservations,
        pendingListings,
        activeListings,
        users,
        unreadMessages,
      ] = await Promise.all([
        prisma.booking.count({ where: { status: "pending" } }),
        prisma.listing.count({ where: { status: "pending" } }),
        prisma.listing.count({ where: { status: "approved", isActive: true } }),
        prisma.user.count(),
        prisma.contactMessage.count({ where: { isRead: false } }),
      ]);

      res.json({
        pendingReservations,
        pendingListings,
        activeListings,
        users,
        unreadMessages,
      });
    } catch (error) {
      next(error);
    }
  }

  static async reservations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status ? String(req.query.status) : undefined;
      res.json(await BookingService.getAll(status));
    } catch (error) {
      next(error);
    }
  }

  static async updateReservation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bookingId = Number(req.params.id);
      const { status, reason } = req.body as {
        status: "confirmed" | "declined" | "cancelled";
        reason?: string;
      };
      if (!["confirmed", "declined", "cancelled"].includes(status)) {
        res.status(400).json({ error: "Invalid status" });
        return;
      }
      const updated = await BookingService.setStatus(bookingId, req.userId!, status, reason);
      res.json(updated);
    } catch (error) {
      if (error instanceof BookingError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      next(error);
    }
  }

  static async users(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { listings: true, bookings: true } },
        },
      });
      res.json(
        users.map((u) => ({
          ...toPublicUser(u),
          listingCount: u._count.listings,
          bookingCount: u._count.bookings,
        })),
      );
    } catch (error) {
      next(error);
    }
  }

  static async messages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const unreadOnly = req.query.unread === "true";
      const messages = await prisma.contactMessage.findMany({
        where: unreadOnly ? { isRead: false } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          listing: { select: { listingId: true, title: true } },
          user: { select: { userId: true, firstName: true, lastName: true, email: true } },
        },
      });
      res.json(messages);
    } catch (error) {
      next(error);
    }
  }

  static async markMessageRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const messageId = Number(req.params.id);
      const message = await prisma.contactMessage.update({
        where: { messageId },
        data: { isRead: true },
      });
      res.json(message);
    } catch (error) {
      next(error);
    }
  }

  static async audit(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const logs = await prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
        include: {
          actor: { select: { userId: true, firstName: true, lastName: true, email: true, role: true } },
        },
      });
      res.json(logs);
    } catch (error) {
      next(error);
    }
  }
}
