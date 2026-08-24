import { query, transaction } from '../config/db';
import { ListingWithRelations, ListingStatus } from '../types/db';
import {
  CreateListingDto,
  GetListingsParams,
  UpdateListingDto,
} from '../types/dto';
import { AppError } from '../utils/errorHandler';
import { parseNumeric } from '../utils/sqlHelpers';
import {
  decodeStoredText,
  sanitizeOptionalText,
  sanitizeRequiredText,
} from '../utils/sanitize';

function mapListing(row: any): ListingWithRelations {
  return {
    listingId: row.listing_id,
    providerId: row.provider_id,
    categoryId: row.category_id,
    locationId: row.location_id,
    title: decodeStoredText(row.title),
    description: row.description
      ? decodeStoredText(row.description)
      : row.description,
    basePrice: parseNumeric(row.base_price) || 0,
    pricingUnit: row.pricing_unit,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    contactEmail: row.contact_email,
    status: row.status,
    isActive: row.is_active,
    coverImageUrl: row.cover_image_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    serviceType: row.service_type,
    guestCapacity: row.guest_capacity,
    isFeatured: row.is_featured,
    images: [],
    features: [],
    amenities: [],
    bookings: [],
    availability: [],
    reviews: [],
    rating: { average: null, count: 0 },
  };
}

async function hydrate(
  listing: ListingWithRelations,
): Promise<ListingWithRelations> {
  const [images, features, bookings, reviews, metadata] = await Promise.all([
    query<any>(
      'SELECT id, listing_id, url, sort_order FROM listing_images WHERE listing_id = $1 ORDER BY sort_order, id',
      [listing.listingId],
    ),
    query<any>(
      'SELECT f.feature_id, f.name FROM features f JOIN listing_features lf ON lf.feature_id = f.feature_id WHERE lf.listing_id = $1 ORDER BY f.name',
      [listing.listingId],
    ),
    query<any>(
      'SELECT booking_id, start_date, end_date FROM bookings WHERE listing_id = $1 ORDER BY start_date',
      [listing.listingId],
    ),
    query<any>(
      'SELECT r.review_id, r.rating, r.comment, r.created_at, u.user_id, u.first_name, u.last_name FROM reviews r JOIN bookings b ON b.booking_id = r.booking_id LEFT JOIN users u ON u.user_id = b.user_id WHERE b.listing_id = $1 ORDER BY r.created_at DESC',
      [listing.listingId],
    ),
    query<any>(
      'SELECT c.category_id, c.name, c.slug, l.location_id, l.name AS location_name, l.lat, l.lng, u.user_id, u.first_name, u.last_name FROM listings x LEFT JOIN categories c ON c.category_id = x.category_id LEFT JOIN locations l ON l.location_id = x.location_id LEFT JOIN users u ON u.user_id = x.provider_id WHERE x.listing_id = $1',
      [listing.listingId],
    ),
  ]);
  const meta = metadata.rows[0];
  const amenities = features.rows.map((row) => ({
    featureId: row.feature_id,
    name: decodeStoredText(row.name),
  }));
  const mappedReviews = reviews.rows.map((row) => ({
    reviewId: row.review_id,
    rating: row.rating,
    comment: row.comment ? decodeStoredText(row.comment) : row.comment,
    createdAt: row.created_at,
    user: row.user_id
      ? {
          userId: row.user_id,
          firstName: decodeStoredText(row.first_name || ''),
          lastName: decodeStoredText(row.last_name || ''),
        }
      : null,
  }));
  const ratingTotal = mappedReviews.reduce(
    (total, review) => total + review.rating,
    0,
  );
  return {
    ...listing,
    images: images.rows.map((row) => ({
      id: row.id,
      listingId: row.listing_id,
      url: row.url,
      sortOrder: row.sort_order,
    })),
    features: amenities,
    amenities,
    bookings: bookings.rows.map((row) => ({
      bookingId: row.booking_id,
      startDate: row.start_date,
      endDate: row.end_date,
    })),
    availability: bookings.rows.map((row) => ({
      startDate: row.start_date,
      endDate: row.end_date,
    })),
    reviews: mappedReviews,
    rating: {
      average: mappedReviews.length ? ratingTotal / mappedReviews.length : null,
      count: mappedReviews.length,
    },
    category: meta?.category_id
      ? { categoryId: meta.category_id, name: meta.name, slug: meta.slug }
      : undefined,
    location: meta?.location_id
      ? {
          locationId: meta.location_id,
          name: meta.location_name,
          lat: parseNumeric(meta.lat) || 0,
          lng: parseNumeric(meta.lng) || 0,
        }
      : undefined,
    provider: meta?.user_id
      ? {
          userId: meta.user_id,
          firstName: decodeStoredText(meta.first_name || ''),
          lastName: decodeStoredText(meta.last_name || ''),
        }
      : undefined,
    owner: meta?.user_id
      ? {
          userId: meta.user_id,
          firstName: decodeStoredText(meta.first_name || ''),
          lastName: decodeStoredText(meta.last_name || ''),
        }
      : undefined,
  };
}

export class ListingService {
  static async findMine(userId: number) {
    const result = await query<any>(
      'SELECT listing_id, provider_id, title, description, base_price, guest_capacity, cover_image_url, service_type, status, created_at FROM listings WHERE provider_id = $1 ORDER BY created_at DESC',
      [userId],
    );
    return result.rows.map((row) => ({
      listingId: row.listing_id,
      providerId: row.provider_id,
      title: decodeStoredText(row.title),
      description: row.description
        ? decodeStoredText(row.description)
        : row.description,
      basePrice: parseNumeric(row.base_price) || 0,
      guestCapacity: row.guest_capacity,
      coverImageUrl: row.cover_image_url,
      serviceType: row.service_type,
      status: row.status,
      createdAt: row.created_at,
    }));
  }

  static async findAll(filters: GetListingsParams) {
    const clauses: string[] = [];
    const params: unknown[] = [];
    const add = (clause: string, value: unknown) => {
      params.push(value);
      clauses.push(clause.replace('?', `$${params.length}`));
    };
    if (filters.publicOnly)
      clauses.push('l.status = \'approved\' AND l.is_active = true');
    if (filters.categoryId) add('l.category_id = ?', filters.categoryId);
    if (filters.locationId) add('l.location_id = ?', filters.locationId);
    if (filters.providerId) add('l.provider_id = ?', filters.providerId);
    if (filters.slug) add('c.slug = ?', filters.slug);
    if (filters.status) add('l.status = ?', filters.status);
    if (filters.featured !== undefined)
      add('l.is_active = ?', filters.featured);
    if (filters.search) {
      params.push(`%${filters.search}%`);
      clauses.push(
        `(l.title ILIKE $${params.length} OR l.description ILIKE $${params.length})`,
      );
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const count = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM listings l LEFT JOIN categories c ON c.category_id = l.category_id ${where}`,
      params,
    );
    const offset = (filters.page - 1) * filters.limit;
    const rows = await query<any>(
      `SELECT l.* FROM listings l LEFT JOIN categories c ON c.category_id = l.category_id ${where} ORDER BY l.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, filters.limit, offset],
    );
    const items = await Promise.all(
      rows.rows.map((row) => hydrate(mapListing(row))),
    );
    const total = Number(count.rows[0]?.count || 0);
    return {
      items,
      pagination: {
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  static async search(filters: import('../types/dto').ListingSearchParams) {
    const clauses = ['l.status = \'approved\'', 'l.is_active = true'];
    const params: unknown[] = [];
    const add = (sql: string, value: unknown) => {
      params.push(value);
      clauses.push(sql.replace('?', `$${params.length}`));
    };
    if (filters.checkIn && filters.checkOut) {
      params.push(filters.checkOut, filters.checkIn);
      clauses.push(
        `NOT EXISTS (SELECT 1 FROM bookings b WHERE b.listing_id = l.listing_id AND b.start_date < $${params.length - 1} AND b.end_date > $${params.length})`,
      );
    }
    if (filters.guests) {
      params.push(filters.guests);
      clauses.push(`l.guest_capacity >= $${params.length}`);
    }
    if (filters.minPrice !== undefined)
      add('l.base_price >= ?', filters.minPrice);
    if (filters.maxPrice !== undefined)
      add('l.base_price <= ?', filters.maxPrice);
    if (filters.serviceType) add('l.service_type = ?', filters.serviceType);
    const where = `WHERE ${clauses.join(' AND ')}`;
    const count = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM listings l ${where}`,
      params,
    );
    const offset = (filters.page - 1) * filters.limit;
    const rows = await query<{ listing_id: number }>(
      `SELECT l.listing_id FROM listings l ${where} ORDER BY l.is_featured DESC, l.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, filters.limit, offset],
    );
    const items = await Promise.all(
      rows.rows.map((row) =>
        this.findById(row.listing_id, { publicOnly: true }),
      ),
    );
    const total = Number(count.rows[0]?.count || 0);
    return {
      items: items.filter(
        (item): item is ListingWithRelations => item !== null,
      ),
      pagination: {
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  static async featured() {
    const rows = await query<{ listing_id: number; service_type: string }>(
      'SELECT listing_id, service_type FROM listings WHERE status = \'approved\' AND is_active = true AND is_featured = true ORDER BY created_at DESC',
    );
    const items = await Promise.all(
      rows.rows.map((row) =>
        this.findById(row.listing_id, { publicOnly: true }),
      ),
    );
    return {
      rentals: items.filter(
        (item, index) =>
          item && rows.rows[index].service_type === 'VACATION_RENTAL',
      ),
      dining: items.filter(
        (item, index) =>
          item && rows.rows[index].service_type === 'RESTAURANT_CAFE',
      ),
      activities: items.filter(
        (item, index) => item && rows.rows[index].service_type === 'ACTIVITY',
      ),
    };
  }

  static async findById(
    listingId: number,
    options: { publicOnly?: boolean } = {},
  ): Promise<ListingWithRelations | null> {
    const result = await query<any>(
      `SELECT l.* FROM listings l WHERE l.listing_id = $1${options.publicOnly ? ' AND l.status = \'approved\' AND l.is_active = true' : ''}`,
      [listingId],
    );
    return result.rows[0] ? hydrate(mapListing(result.rows[0])) : null;
  }

  static async create(data: CreateListingDto): Promise<ListingWithRelations> {
    const id = await transaction(async (client) => {
      const inserted = await client.query<{ listing_id: number }>(
        'INSERT INTO listings (provider_id, category_id, location_id, title, description, base_price, pricing_unit, contact_name, contact_phone, contact_email, cover_image_url, service_type, guest_capacity, status, is_active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,\'pending\',false) RETURNING listing_id',
        [
          data.providerId || null,
          data.categoryId,
          data.locationId || null,
          sanitizeRequiredText(data.title, 'title'),
          sanitizeOptionalText(data.description) || null,
          data.basePrice,
          sanitizeOptionalText(data.pricingUnit) || null,
          sanitizeOptionalText(data.contactName) || null,
          sanitizeOptionalText(data.contactPhone) || null,
          data.contactEmail || null,
          data.coverImageUrl || null,
          data.serviceType || null,
          data.guestCapacity || null,
        ],
      );
      const listingId = inserted.rows[0].listing_id;
      for (const categoryId of data.categoryIds || [])
        await client.query(
          'INSERT INTO listing_categories (listing_id, category_id) VALUES ($1,$2)',
          [listingId, categoryId],
        );
      for (const [index, url] of (data.imageUrls || []).entries())
        await client.query(
          'INSERT INTO listing_images (listing_id, url, sort_order) VALUES ($1, $2, $3)',
          [listingId, url, index],
        );
      for (const featureId of data.featureIds || [])
        await client.query(
          'INSERT INTO listing_features (listing_id, feature_id) VALUES ($1, $2)',
          [listingId, featureId],
        );
      return listingId;
    });
    const listing = await this.findById(id);
    if (!listing)
      throw new AppError(500, 'Created listing could not be loaded');
    return listing;
  }

  static async update(
    listingId: number,
    userId: number,
    role: string,
    data: UpdateListingDto,
  ): Promise<ListingWithRelations> {
    const current = await this.findById(listingId);
    if (!current) throw new AppError(404, 'Listing not found');
    const staff = ['ADMIN', 'admin', 'moderator', 'staff'].includes(role);
    if (!staff && current.providerId !== userId)
      throw new AppError(403, 'You cannot update this listing');
    const columns: Record<string, unknown> = {
      category_id: data.categoryId,
      location_id: data.locationId,
      title:
        data.title === undefined
          ? undefined
          : sanitizeRequiredText(data.title, 'title'),
      description: sanitizeOptionalText(data.description),
      base_price: data.basePrice,
      pricing_unit: sanitizeOptionalText(data.pricingUnit),
      contact_name: sanitizeOptionalText(data.contactName),
      contact_phone: sanitizeOptionalText(data.contactPhone),
      contact_email: data.contactEmail,
      cover_image_url: data.coverImageUrl,
      service_type: data.serviceType,
      guest_capacity: data.guestCapacity,
      status: staff ? undefined : 'pending',
      is_active: staff ? undefined : false,
    };
    await transaction(async (client) => {
      const entries = Object.entries(columns).filter(
        ([, value]) => value !== undefined,
      );
      if (entries.length)
        await client.query(
          `UPDATE listings SET ${entries.map(([key], index) => `${key} = $${index + 2}`).join(', ')}, updated_at = now() WHERE listing_id = $1`,
          [listingId, ...entries.map(([, value]) => value)],
        );
      if (data.imageUrls) {
        await client.query('DELETE FROM listing_images WHERE listing_id = $1', [
          listingId,
        ]);
        for (const [index, url] of data.imageUrls.entries())
          await client.query(
            'INSERT INTO listing_images (listing_id, url, sort_order) VALUES ($1,$2,$3)',
            [listingId, url, index],
          );
      }
      if (data.featureIds) {
        await client.query(
          'DELETE FROM listing_features WHERE listing_id = $1',
          [listingId],
        );
        for (const featureId of data.featureIds)
          await client.query(
            'INSERT INTO listing_features (listing_id, feature_id) VALUES ($1,$2)',
            [listingId, featureId],
          );
      }
      if (data.categoryIds) {
        await client.query(
          'DELETE FROM listing_categories WHERE listing_id = $1',
          [listingId],
        );
        for (const categoryId of data.categoryIds)
          await client.query(
            'INSERT INTO listing_categories (listing_id, category_id) VALUES ($1,$2)',
            [listingId, categoryId],
          );
      }
    });
    return (await this.findById(listingId)) as ListingWithRelations;
  }

  static async setStatus(
    listingId: number,
    actorId: number,
    status: ListingStatus,
    reason?: string,
  ) {
    const result = await transaction(async (client) => {
      const updated = await client.query<any>(
        'UPDATE listings SET status = $1, is_active = ($1 = \'approved\'), updated_at = now() WHERE listing_id = $2 RETURNING *',
        [status, listingId],
      );
      if (!updated.rows[0]) throw new AppError(404, 'Listing not found');
      await client.query(
        'INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, reason) VALUES ($1, $2, $3, $4, $5)',
        [
          actorId,
          `status:${status}`,
          'listing',
          listingId,
          sanitizeOptionalText(reason) || null,
        ],
      );
      return updated.rows[0];
    });
    return this.findById(listingId);
  }
  static async delete(listingId: number, userId: number, role: string) {
    const current = await this.findById(listingId);
    if (!current) throw new AppError(404, 'Listing not found');
    if (
      !['ADMIN', 'admin', 'moderator', 'staff'].includes(role) &&
      current.providerId !== userId
    )
      throw new AppError(403, 'You cannot delete this listing');
    await transaction(async (client) => {
      await client.query(
        'INSERT INTO audit_logs (actor_id, action, entity_type, entity_id) VALUES ($1, $2, $3, $4)',
        [userId, 'delete', 'listing', listingId],
      );
      await client.query('DELETE FROM listings WHERE listing_id = $1', [
        listingId,
      ]);
    });
  }
}
