import { prisma } from "../config/db.js";
import { PricingUnit, Prisma } from "@prisma/client";

export interface GetListingsParams {
  page?: number;
  limit?: number;
  categoryId?: number;
  locationId?: number;
  search?: string;
}

export class ListingService {
  static async findAll(params: GetListingsParams) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Number(params.limit) || 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.categoryId && !isNaN(params.categoryId)) {
      where.categoryId = Number(params.categoryId);
    }

    if (params.locationId && !isNaN(params.locationId)) {
      where.locationId = Number(params.locationId);
    }

    if (params.search && params.search.trim() !== "") {
      where.OR = [
        { title: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          category: true,
          location: true,
          provider: {
            select: { userId: true, firstName: true, lastName: true, email: true },
          },
        },
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
    const [listing, requester] = await Promise.all([
      prisma.listing.findUnique({ where: { listingId } }),
      prisma.user.findUnique({
        where: { userId },
        select: { role: true },
      }),
    ]);

    if (!listing) throw new Error("NOT_FOUND");
    if (requester?.role !== "admin" && listing.providerId !== userId) {
      throw new Error("UNAUTHORIZED");
    }

    return prisma.listing.delete({ where: { listingId } });
  }
}
