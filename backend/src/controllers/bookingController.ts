import { Request, Response } from "express";
import { BookingService, BookingError } from "../services/bookingService.js";

export class BookingController {
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { listingId, startDatetime, endDatetime, guestName, guestPhone, guestCount, message } = req.body;

      if (!listingId || !startDatetime || !endDatetime) {
        res.status(400).json({ error: "listingId, startDatetime, and endDatetime are required" });
        return;
      }
      if (!guestName || !guestPhone) {
        res.status(400).json({ error: "Le nom et le téléphone sont requis" });
        return;
      }

      const booking = await BookingService.createBooking({
        clientId: req.userId!,
        listingId: Number(listingId),
        startDatetime: new Date(startDatetime),
        endDatetime: new Date(endDatetime),
        guestName: String(guestName),
        guestPhone: String(guestPhone),
        guestCount: guestCount ? Number(guestCount) : 1,
        message: message ? String(message) : undefined,
      });

      res.status(201).json(booking);
    } catch (error) {
      if (error instanceof BookingError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      console.error("Booking Create Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getMyBookings(req: Request, res: Response): Promise<void> {
    try {
      const bookings = await BookingService.getBookingsByClient(req.userId!);
      res.status(200).json(bookings);
    } catch (error) {
      console.error("Get Bookings Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const bookingId = Number(req.params["bookingId"]);
      if (isNaN(bookingId)) {
        res.status(400).json({ error: "Invalid booking ID" });
        return;
      }

      const booking = await BookingService.getBookingById(bookingId, req.userId!);
      if (!booking) {
        res.status(404).json({ error: "Booking not found" });
        return;
      }

      res.status(200).json(booking);
    } catch (error) {
      console.error("Get Booking Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async cancel(req: Request, res: Response): Promise<void> {
    try {
      const bookingId = Number(req.params["bookingId"]);
      if (isNaN(bookingId)) {
        res.status(400).json({ error: "Invalid booking ID" });
        return;
      }

      const updated = await BookingService.cancelBooking(bookingId, req.userId!);
      res.status(200).json(updated);
    } catch (error) {
      if (error instanceof BookingError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      console.error("Cancel Booking Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}
