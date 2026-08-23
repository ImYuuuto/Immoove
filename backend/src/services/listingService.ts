import { prisma } from "../config/db.js";
import { ListingStatus, PricingUnit, Prisma } from "@prisma/client";

export interface GetListingsParams {
  page?: number;
  limit?: number;
  categoryId?: number;
  locationId?: number;
  search?: string;
  slug?: string;
  status?: ListingStatus;
  featured?: boolean;
  includeAllStatuses?: boolean;
  providerId?: number;
}

const listingInclude = {
  category: true,
  location: true,
  images: { orderBy: { sortOrder: "asc" as const } },
  features: { include: { feature: true } },
  propertyDetails: true,
  vehicleDetails: true,
  serviceDetails: true,
  availabilitySlots: true,
  provider: {
    select: { userId: true, firstName: true, lastName: true, email: true, phone: true },
  },
  bookings: {
    where: { review: { isNot: null } },
    select: { review: { select: { rating: true, comment: true, createdAt: true } } },
  },
};

function withRating<T extends { bookings: { review: { rating: number } | null }[] }>(listing: T) {
  const ratings = listing.bookings
    .map((b) => b.review?.rating)
    .filter((r): r is number => typeof r === "number");
  const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
  const { bookings, ...rest } = listing;
  return {
    ...rest,
    rating: avg ? Number(avg.toFixed(1)) : null,
    reviewCount: ratings.length,
  };
}

export class ListingService {
  static async findAll(params: GetListingsParams) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Number(params.limit) || 12);
    const skip = (page - 1) * limit;

    const where: Prisma.ListingWhereInput = {};

    if (params.includeAllStatuses) {
      if (params.status) where.status = params.status;
    } else {
      where.status = "approved";
      where.isActive = true;
    }

    if (params.categoryId && !isNaN(params.categoryId)) {
      where.categoryId = Number(params.categoryId);
    }

    if (params.locationId && !isNaN(params.locationId)) {
      where.locationId = Number(params.locationId);
    }

    if (params.slug) {
      where.category = { slug: params.slug };
    }

    if (params.providerId) {
      where.providerId = params.providerId;
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
        include: listingInclude,
      }),
      prisma.listing.count({ where }),
    ]);

    return {
      items: items.map(withRating),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async findById(listingId: number, opts?: { staff?: boolean; userId?: number }) {
    const listing = await prisma.listing.findUnique({
      where: { listingId },
      include: listingInclude,
    });
    if (!listing) return null;

    const isOwner = opts?.userId === listing.providerId;
    const isPublic = listing.status === "approved" && listing.isActive;
    if (!isPublic && !opts?.staff && !isOwner) return null;

    return withRating(listing);
  }

  static async create(data: {
    providerId: number;
    categoryId: number;
    locationId: number;
    title: string;
    description?: string;
    basePrice: number;
    pricingUnit: PricingUnit;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    imageUrls?: string[];
    autoApprove?: boolean;
  }) {
    const status: ListingStatus = data.autoApprove ? "approved" : "pending";
    const urls = (data.imageUrls || []).filter(Boolean);

    return prisma.listing.create({
      data: {
        providerId: data.providerId,
        categoryId: data.categoryId,
        locationId: data.locationId,
        title: data.title,
        description: data.description,
        basePrice: new Prisma.Decimal(data.basePrice),
        pricingUnit: data.pricingUnit,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
        status,
        isActive: status === "approved",
        coverImageUrl: urls[0] || null,
        images: urls.length
          ? {
              create: urls.map((url, i) => ({ url, sortOrder: i })),
            }
          : undefined,
      },
      include: listingInclude,
    });
  }

  static async update(
    listingId: number,
    userId: number,
    role: string,
    data: Partial<{
      title: string;
      description: string;
      basePrice: number;
      pricingUnit: PricingUnit;
      categoryId: number;
      locationId: number;
      isActive: boolean;
      contactName: string;
      contactPhone: string;
      contactEmail: string;
      imageUrls: string[];
    }>,
  ) {
    const listing = await prisma.listing.findUnique({ where: { listingId } });
    if (!listing) throw new Error("NOT_FOUND");
    if (role !== "admin" && role !== "moderator" && listing.providerId !== userId) {
      throw new Error("UNAUTHORIZED");
    }

    const { imageUrls, basePrice, ...rest } = data;

    return prisma.$transaction(async (tx) => {
      if (imageUrls) {
        await tx.listingImage.deleteMany({ where: { listingId } });
        if (imageUrls.length) {
          await tx.listingImage.createMany({
            data: imageUrls.map((url, i) => ({ listingId, url, sortOrder: i })),
          });
        }
      }

      return tx.listing.update({
        where: { listingId },
        data: {
          ...rest,
          ...(basePrice !== undefined ? { basePrice: new Prisma.Decimal(basePrice) } : {}),
          ...(imageUrls ? { coverImageUrl: imageUrls[0] || null } : {}),
        },
        include: listingInclude,
      });
    });
  }

  static async setStatus(
    listingId: number,
    actorId: number,
    status: ListingStatus,
    reason?: string,
  ) {
    const listing = await prisma.listing.findUnique({ where: { listingId } });
    if (!listing) throw new Error("NOT_FOUND");

    const updated = await prisma.listing.update({
      where: { listingId },
      data: {
        status,
        isActive: status === "approved",
      },
      include: listingInclude,
    });

    await prisma.auditLog.create({
      data: {
        actorId,
        action: `listing.${status}`,
        entityType: "listing",
        entityId: listingId,
        reason,
      },
    });

    return updated;
  }

  static async delete(listingId: number, userId: number, role?: string) {
    const listing = await prisma.listing.findUnique({ where: { listingId } });
    if (!listing) throw new Error("NOT_FOUND");
    if (role !== "admin" && role !== "moderator" && listing.providerId !== userId) {
      throw new Error("UNAUTHORIZED");
    }

    await prisma.auditLog.create({
      data: {
        actorId: userId,
        action: "listing.deleted",
        entityType: "listing",
        entityId: listingId,
      },
    });

    return prisma.listing.delete({ where: { listingId } });
  }
}
