import { prisma } from "../config/db.js";
import { PricingUnit, Prisma } from "@prisma/client";

interface GetListingsParams {
  page: number;
  limit: number;
  categoryId?: number;
  locationId?: number;
  search?: string;
}

export class ListingService {
  static async findAll({ page, limit, categoryId, locationId, search }: GetListingsParams) {
    const skip = (page - 1) * limit;

    const where: Prisma.ListingWhereInput = {
      isActive: true,
      ...(categoryId && { categoryId }),
      ...(locationId && { locationId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          location: true,
          propertyDetails: true,
          vehicleDetails: true,
          serviceDetails: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.listing.count({ where }),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async findById(listingId: number) {
    return prisma.listing.findUnique({
      where: { listingId },
      include: {
        category: true,
        location: true,
        propertyDetails: true,
        vehicleDetails: true,
        serviceDetails: true,
        features: { include: { feature: true } },
      },
    });
  }

  static async create(data: {
    providerId: number;
    categoryId: number;
    locationId: number;
    title: string;
    description?: string;
    basePrice: number;
    pricingUnit: PricingUnit;
  }) {
    return prisma.listing.create({
      data: {
        ...data,
        basePrice: new Prisma.Decimal(data.basePrice),
      },
    });
  }

  static async delete(listingId: number, userId: number) {
    const listing = await prisma.listing.findUnique({ where: { listingId } });
    if (!listing) throw new Error("NOT_FOUND");
    if (listing.providerId !== userId) throw new Error("UNAUTHORIZED");

    return prisma.listing.delete({ where: { listingId } });
  }
}