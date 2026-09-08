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
import { cached, invalidateCache } from '../config/cache';
import { hydrateListing, mapListing } from './listings/listingHydrator';
import { getPropertyDiscoveryOptions, searchListings } from './listings/listingDiscovery';

export class ListingService {
  static async findMine(userId: number) {
    const result = await query<any>(
      'SELECT listing_id, provider_id, title, description, base_price, guest_capacity, cover_image_url, service_type, status, created_at FROM listings WHERE provider_id = ? ORDER BY created_at DESC',
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
    if (filters.publicOnly) {
      return cached('listings', `all:${JSON.stringify(filters)}`, () =>
        this.findAllUncached(filters),
      );
    }
    return this.findAllUncached(filters);
  }

  private static async findAllUncached(filters: GetListingsParams) {
    const clauses: string[] = [];
    const params: unknown[] = [];
    const add = (clause: string, value: unknown) => {
      params.push(value);
      clauses.push(clause);
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
      clauses.push('(l.title LIKE ? OR l.description LIKE ?)');
      params.push(`%${filters.search}%`);
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const count = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM listings l LEFT JOIN categories c ON c.category_id = l.category_id ${where}`,
      params,
    );
    const offset = (filters.page - 1) * filters.limit;
    const rows = await query<any>(
      `SELECT l.* FROM listings l LEFT JOIN categories c ON c.category_id = l.category_id ${where} ORDER BY l.created_at DESC LIMIT ? OFFSET ?`,
      [...params, filters.limit, offset],
    );
    const items = await Promise.all(
      rows.rows.map((row) => hydrateListing(mapListing(row))),
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
    return cached('listings', `search:${JSON.stringify(filters)}`, () =>
      this.searchUncached(filters),
    );
  }

  private static async searchUncached(
    filters: import('../types/dto').ListingSearchParams,
  ) {
    return searchListings(filters, (listingId) =>
      this.findById(listingId, { publicOnly: true }),
    );
  }

  static async propertyDiscoveryOptions() {
    return cached('categories', 'property-discovery-v1', () =>
      getPropertyDiscoveryOptions(),
    );
  }

  static async featured() {
    return cached('listings', 'featured-v2', () => this.featuredUncached());
  }

  private static async featuredUncached() {
    const rows = await query<{ listing_id: number }>(
      'SELECT listing_id FROM listings WHERE status=\'approved\' AND is_active=true AND archived_at IS NULL AND service_type=\'VACATION_RENTAL\' ORDER BY is_featured DESC, created_at DESC LIMIT 6',
    );
    const items = await Promise.all(
      rows.rows.map((row) =>
        this.findById(row.listing_id, { publicOnly: true }),
      ),
    );
    return {
      rentals: items.filter((item): item is ListingWithRelations => item !== null),
    };
  }

  static async findById(
    listingId: number,
    options: { publicOnly?: boolean } = {},
  ): Promise<ListingWithRelations | null> {
    if (options.publicOnly) {
      return cached('listings', `item:${listingId}`, () =>
        this.findByIdUncached(listingId, options),
      );
    }
    return this.findByIdUncached(listingId, options);
  }

  private static async findByIdUncached(
    listingId: number,
    options: { publicOnly?: boolean } = {},
  ): Promise<ListingWithRelations | null> {
    const result = await query<any>(
      `SELECT l.* FROM listings l WHERE l.listing_id = ?${options.publicOnly ? ' AND l.status = \'approved\' AND l.is_active = true' : ''}`,
      [listingId],
    );
    return result.rows[0] ? hydrateListing(mapListing(result.rows[0])) : null;
  }

  static async create(data: CreateListingDto): Promise<ListingWithRelations> {
    const id = await transaction(async (client) => {
      const inserted = await client.query<{ listing_id: number }>(
        'INSERT INTO listings (provider_id, category_id, location_id, area_id, property_type_id, title, description, base_price, pricing_unit, contact_name, contact_phone, contact_email, cover_image_url, service_type, rental_term, guest_capacity, bedrooms, beds, bathrooms, status, is_active) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,\'pending\',false)',
        [
          data.providerId || null,
          data.categoryId,
          data.locationId || null,
          data.areaId || null,
          data.propertyTypeId || null,
          sanitizeRequiredText(data.title, 'title'),
          sanitizeOptionalText(data.description) || null,
          data.basePrice,
          sanitizeOptionalText(data.pricingUnit) || null,
          sanitizeOptionalText(data.contactName) || null,
          sanitizeOptionalText(data.contactPhone) || null,
          data.contactEmail || null,
          data.coverImageUrl || null,
          'VACATION_RENTAL',
          data.rentalTerm || 'short_term',
          data.guestCapacity || null,
          data.bedrooms ?? null,
          data.beds ?? null,
          data.bathrooms ?? null,
        ],
      );
      const listingId = inserted.insertId;
      if (!listingId) throw new AppError(500, 'Listing insert failed');
      for (const categoryId of data.categoryIds || [])
        await client.query(
          'INSERT INTO listing_categories (listing_id, category_id) VALUES (?,?)',
          [listingId, categoryId],
        );
      for (const [index, url] of (data.imageUrls || []).entries())
        await client.query(
          'INSERT INTO listing_images (listing_id, url, sort_order) VALUES (?, ?, ?)',
          [listingId, url, index],
        );
      for (const featureId of data.featureIds || [])
        await client.query(
          'INSERT INTO listing_features (listing_id, feature_id) VALUES (?, ?)',
          [listingId, featureId],
        );
      return listingId;
    });
    const listing = await this.findById(id);
    if (!listing)
      throw new AppError(500, 'Created listing could not be loaded');
    await invalidateCache('listings', 'categories');
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
    const admin = role === 'ADMIN';
    if (!admin && role !== 'CLIENT') throw new AppError(403, 'Invalid account role');
    if (!admin && current.providerId !== userId)
      throw new AppError(403, 'You can only edit your own property');
    const columns: Record<string, unknown> = {
      category_id: data.categoryId,
      location_id: data.locationId,
      area_id: data.areaId,
      property_type_id: data.propertyTypeId,
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
      rental_term: data.rentalTerm,
      guest_capacity: data.guestCapacity,
      bedrooms: data.bedrooms,
      beds: data.beds,
      bathrooms: data.bathrooms,
    };
    await transaction(async (client) => {
      const entries = Object.entries(columns).filter(
        ([, value]) => value !== undefined,
      );
      if (entries.length)
        await client.query(
          `UPDATE listings SET ${entries.map(([key]) => `${key} = ?`).join(', ')}, updated_at = now() WHERE listing_id = ?`,
          [...entries.map(([, value]) => value), listingId],
        );
      if (!admin)
        await client.query(
          `UPDATE listings SET status = 'pending', is_active = false, updated_at = now()
           WHERE listing_id = ?`,
          [listingId],
        );
      if (data.imageUrls) {
        await client.query('DELETE FROM listing_images WHERE listing_id = ?', [
          listingId,
        ]);
        for (const [index, url] of data.imageUrls.entries())
          await client.query(
            'INSERT INTO listing_images (listing_id, url, sort_order) VALUES (?,?,?)',
            [listingId, url, index],
          );
      }
      if (data.featureIds) {
        await client.query(
          'DELETE FROM listing_features WHERE listing_id = ?',
          [listingId],
        );
        for (const featureId of data.featureIds)
          await client.query(
            'INSERT INTO listing_features (listing_id, feature_id) VALUES (?,?)',
            [listingId, featureId],
          );
      }
      if (data.categoryIds) {
        await client.query(
          'DELETE FROM listing_categories WHERE listing_id = ?',
          [listingId],
        );
        for (const categoryId of data.categoryIds)
          await client.query(
            'INSERT INTO listing_categories (listing_id, category_id) VALUES (?,?)',
            [listingId, categoryId],
          );
      }
    });
    const listing = (await this.findById(listingId)) as ListingWithRelations;
    await invalidateCache('listings', 'categories');
    return listing;
  }

  static async appendImages(listingId: number, actorId: number, role: string, urls: string[]) {
    if (role !== 'ADMIN') throw new AppError(403, 'Administrator access required');
    if (!(await this.findById(listingId))) throw new AppError(404, 'Listing not found');
    await transaction(async client => {
      const offset = await client.query<{ next_order: number }>(
        'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM listing_images WHERE listing_id = ?',
        [listingId],
      );
      const start = Number(offset.rows[0]?.next_order || 0);
      for (const [index, url] of urls.entries())
        await client.query(
          'INSERT INTO listing_images(listing_id,url,sort_order) VALUES(?,?,?)',
          [listingId, url, start + index],
        );
      await client.query(
        'INSERT INTO audit_logs(actor_id,action,entity_type,entity_id) VALUES(?,?,?,?)',
        [actorId, 'images:upload', 'listing', listingId],
      );
    });
    await invalidateCache('listings');
    return this.findById(listingId);
  }

  static async reorderImages(listingId: number, actorId: number, role: string, imageIds: number[]) {
    if (role !== 'ADMIN') throw new AppError(403, 'Administrator access required');
    if (!imageIds.length || new Set(imageIds).size !== imageIds.length) throw new AppError(400, 'Image IDs must be nonempty and unique');
    await transaction(async client => {
      const owned = await client.query<{ id: number }>(
        `SELECT id FROM listing_images WHERE listing_id=? AND id IN (${imageIds.map(() => '?').join(',')})`,
        [listingId, ...imageIds],
      );
      if (owned.rows.length !== imageIds.length)
        throw new AppError(400, 'Every image must belong to the listing');
      for (const [sortOrder, imageId] of imageIds.entries())
        await client.query('UPDATE listing_images SET sort_order=? WHERE id=?', [sortOrder, imageId]);
      await client.query(
        'INSERT INTO audit_logs(actor_id,action,entity_type,entity_id) VALUES(?,?,?,?)',
        [actorId, 'images:reorder', 'listing', listingId],
      );
    });
    await invalidateCache('listings');
    return this.findById(listingId);
  }

  static async addAvailabilityBlock(listingId: number, actorId: number, role: string, startDate: Date, endDate: Date, note?: string) {
    if (role !== 'ADMIN') throw new AppError(403, 'Administrator access required');
    const result = await query<any>(
      `INSERT INTO listing_availability_blocks(listing_id,start_date,end_date,note,created_by)
       SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM listings WHERE listing_id=?)`,
      [listingId, startDate, endDate, sanitizeOptionalText(note) || null, actorId, listingId],
    );
    if (!result.rowCount) throw new AppError(404, 'Listing not found');
    await invalidateCache('listings');
    return { blockId: result.insertId, startDate, endDate, note: sanitizeOptionalText(note) || null };
  }

  static async removeAvailabilityBlock(listingId: number, blockId: number, role: string) {
    if (role !== 'ADMIN') throw new AppError(403, 'Administrator access required');
    const result = await query(
      'DELETE FROM listing_availability_blocks WHERE block_id=? AND listing_id=?',
      [blockId, listingId],
    );
    if (!result.rowCount) throw new AppError(404, 'Availability block not found');
    await invalidateCache('listings');
  }

  static async setStatus(
    listingId: number,
    actorId: number,
    actorRole: string,
    status: ListingStatus,
    reason?: string,
  ) {
    if (actorRole !== 'ADMIN') throw new AppError(403, 'Administrator access required');
    const result = await transaction(async (client) => {
      const updated = await client.query<any>(
        'UPDATE listings SET status = ?, is_active = (? = \'approved\'), updated_at = now() WHERE listing_id = ?',
        [status, status, listingId],
      );
      if (!updated.rowCount) throw new AppError(404, 'Listing not found');
      await client.query(
        'INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, reason) VALUES (?, ?, ?, ?, ?)',
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
    const listing = await this.findById(listingId);
    await invalidateCache('listings', 'categories');
    return listing;
  }
  static async delete(listingId: number, userId: number, role: string) {
    const current = await this.findById(listingId);
    if (!current) throw new AppError(404, 'Listing not found');
    if (!['CLIENT', 'ADMIN'].includes(role)) throw new AppError(403, 'Invalid account role');
    if (role !== 'ADMIN' && current.providerId !== userId)
      throw new AppError(403, 'You can only delete your own property');
    await transaction(async (client) => {
      await client.query(
        'INSERT INTO audit_logs (actor_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)',
        [userId, 'delete', 'listing', listingId],
      );
      await client.query('DELETE FROM listings WHERE listing_id = ?', [
        listingId,
      ]);
    });
    await invalidateCache('listings', 'categories');
  }
}
