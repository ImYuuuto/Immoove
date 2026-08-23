import prisma from "../config/db.js";
import { PrismaClient, PricingUnit } from "@prisma/client";

type TransactionClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

const MS_PER_HOUR = 1000 * 60 * 60;
const MS_PER_DAY = MS_PER_HOUR * 24;

function calculateTotalPrice(
  basePrice: number,
  pricingUnit: PricingUnit,
  startDatetime: Date,
  endDatetime: Date
): string {
  const durationMs = endDatetime.getTime() - startDatetime.getTime();

  switch (pricingUnit) {
    case "per_hour": {
      const hours = durationMs / MS_PER_HOUR;
      return (basePrice * hours).toFixed(2);
    }
    case "per_day":
    case "per_night": {
      const units = Math.max(1, Math.ceil(durationMs / MS_PER_DAY));
      return (basePrice * units).toFixed(2);
    }
    case "per_service":
      return basePrice.toFixed(2);
    default:
      throw new BookingError(`Unknown pricing unit: ${pricingUnit}`, 500);
  }
}

export class BookingService {
  /**
   * Creates a booking inside a Prisma transaction using SELECT FOR UPDATE
   * to lock the listing row. This prevents two concurrent requests from
   * double-booking the same listing for overlapping time slots.
   */
  static async createBooking(data: {
    clientId: number;
    listingId: number;
    startDatetime: Date;
    endDatetime: Date;
    guestName?: string;
    guestPhone?: string;
    guestCount?: number;
    message?: string;
  }) {
    const { clientId, listingId, startDatetime, endDatetime } = data;

    if (startDatetime >= endDatetime) {
      throw new BookingError("Start time must be before end time", 400);
    }

    return prisma.$transaction(async (tx: TransactionClient) => {
      // Step 1: Lock the listing row to serialize concurrent booking attempts.
      // Any other transaction trying to book the same listing will wait here.
      const listings = await tx.$queryRaw<
        { listing_id: number; base_price: string; pricing_unit: PricingUnit }[]
      >`
        SELECT listing_id, base_price, pricing_unit
        FROM listings
        WHERE listing_id = ${listingId}
          AND is_active = true
        FOR UPDATE
      `;

      if (listings.length === 0) {
        throw new BookingError("Listing not found or is not active", 404);
      }

      const listing = listings[0]!;

      // Step 2: Check for any overlapping bookings (non-cancelled).
      // Overlap condition: existing.start < new.end AND existing.end > new.start
      const overlapping = await tx.$queryRaw<{ booking_id: number }[]>`
        SELECT booking_id
        FROM bookings
        WHERE listing_id = ${listingId}
          AND status NOT IN ('cancelled', 'declined')
          AND start_datetime < ${endDatetime}
          AND end_datetime > ${startDatetime}
        LIMIT 1
      `;

      if (overlapping.length > 0) {
        throw new BookingError(
          "This listing is already booked for the requested time slot",
          409
        );
      }

      const basePrice = parseFloat(listing.base_price);
      const totalPrice = calculateTotalPrice(
        basePrice,
        listing.pricing_unit,
        startDatetime,
        endDatetime
      );

      // Step 4: Create the booking
      const booking = await tx.booking.create({
        data: {
          clientId,
          listingId,
          startDatetime,
          endDatetime,
          totalPrice: totalPrice,
          status: "pending",
          guestName: data.guestName,
          guestPhone: data.guestPhone,
          guestCount: data.guestCount ?? 1,
          message: data.message,
        },
        include: {
          listing: {
            select: {
              title: true,
              pricingUnit: true,
              category: { select: { name: true } },
              location: { select: { cityName: true, country: true } },
            },
          },
        },
      });

      return booking;
    });
  }

  static async getBookingsByClient(clientId: number) {
    return prisma.booking.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      include: {
        listing: {
          select: {
            title: true,
            pricingUnit: true,
            category: { select: { name: true } },
            location: { select: { cityName: true, country: true } },
          },
        },
        payment: true,
      },
    });
  }

  static async getBookingById(bookingId: number, clientId: number) {
    return prisma.booking.findFirst({
      where: { bookingId, clientId },
      include: {
        listing: {
          select: {
            title: true,
            pricingUnit: true,
            category: { select: { name: true } },
            location: { select: { cityName: true, country: true } },
          },
        },
        payment: true,
        review: true,
      },
    });
  }

  static async cancelBooking(bookingId: number, clientId: number) {
    const booking = await prisma.booking.findFirst({
      where: { bookingId, clientId },
    });

    if (!booking) {
      throw new BookingError("Booking not found", 404);
    }

    if (booking.status === "completed" || booking.status === "cancelled") {
      throw new BookingError(`Cannot cancel a booking with status '${booking.status}'`, 400);
    }

    return prisma.booking.update({
      where: { bookingId },
      data: { status: "cancelled" },
    });
  }

  static async getAll(status?: string) {
    return prisma.booking.findMany({
      where: status ? { status: status as never } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        client: {
          select: { userId: true, firstName: true, lastName: true, email: true, phone: true },
        },
        listing: {
          select: {
            listingId: true,
            title: true,
            pricingUnit: true,
            category: { select: { name: true } },
            location: { select: { cityName: true, country: true } },
          },
        },
      },
    });
  }

  static async setStatus(bookingId: number, actorId: number, status: "confirmed" | "declined" | "cancelled", reason?: string) {
    const booking = await prisma.booking.findUnique({ where: { bookingId } });
    if (!booking) throw new BookingError("Booking not found", 404);

    const updated = await prisma.booking.update({
      where: { bookingId },
      data: { status },
      include: {
        client: {
          select: { userId: true, firstName: true, lastName: true, email: true, phone: true },
        },
        listing: { select: { listingId: true, title: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId,
        action: `booking.${status}`,
        entityType: "booking",
        entityId: bookingId,
        reason,
      },
    });

    return updated;
  }
}

export class BookingError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "BookingError";
  }
}
