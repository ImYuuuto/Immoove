import { prisma } from "../config/db.js";
import { FuelType, Transmission } from "@prisma/client";

export class SpecializedListingService {
  private static async verifyListingOwner(listingId: number, userId: number) {
    const listing = await prisma.listing.findUnique({ where: { listingId } });
    if (!listing) throw new Error("NOT_FOUND");
    if (listing.providerId !== userId) throw new Error("UNAUTHORIZED");
  }

  static async createPropertyDetail(
    listingId: number,
    userId: number,
    data: {
      propertyType: string;
      bedrooms?: number;
      bathrooms?: number;
      maxGuests?: number;
      streetAddress: string;
    }
  ) {
    await this.verifyListingOwner(listingId, userId);
    return prisma.propertyDetail.upsert({
      where: { listingId },
      update: data,
      create: { listingId, ...data },
    });
  }

  static async createVehicleDetail(
    listingId: number,
    userId: number,
    data: {
      make: string;
      model: string;
      year: number;
      transmission?: Transmission;
      fuelType?: FuelType;
      seats?: number;
    }
  ) {
    await this.verifyListingOwner(listingId, userId);
    return prisma.vehicleDetail.upsert({
      where: { listingId },
      update: data,
      create: { listingId, ...data },
    });
  }

  static async createServiceDetail(
    listingId: number,
    userId: number,
    data: {
      durationMinutes: number;
      isAtHome?: boolean;
      shopAddress?: string;
    }
  ) {
    await this.verifyListingOwner(listingId, userId);
    return prisma.serviceDetail.upsert({
      where: { listingId },
      update: data,
      create: { listingId, ...data },
    });
  }
}