import { query, transaction } from '../config/db';
import { AppError } from '../utils/errorHandler';
import { sanitizeOptionalText, sanitizeRequiredText } from '../utils/sanitize';
import { ListingService } from './listingService';

export class PlatformService {
  static async listAnnouncements() {
    const result = await query<any>(
      'SELECT request_id, requester_id, service_type, title, description, address, contact_phone, status, created_at FROM announcement_requests ORDER BY created_at DESC',
    );
    return result.rows;
  }
  static async createAnnouncement(data: {
    requesterId: number;
    serviceType: string;
    title: string;
    description?: string;
    address: string;
    contactPhone?: string;
  }) {
    const result = await query<any>(
      'INSERT INTO announcement_requests (requester_id, service_type, title, description, address, contact_phone) VALUES ($1,$2,$3,$4,$5,$6) RETURNING request_id, requester_id, service_type, title, description, address, contact_phone, status, created_at',
      [
        data.requesterId,
        data.serviceType,
        sanitizeRequiredText(data.title, 'title'),
        sanitizeOptionalText(data.description) || null,
        sanitizeRequiredText(data.address, 'address'),
        sanitizeOptionalText(data.contactPhone) || null,
      ],
    );
    return result.rows[0];
  }
  static async reviewAnnouncement(
    requestId: number,
    reviewerId: number,
    status: string,
    reason?: string,
  ) {
    return transaction(async (client) => {
      const result = await client.query<any>(
        'UPDATE announcement_requests SET status = $1, reviewed_by = $2, review_reason = $3, updated_at = now() WHERE request_id = $4 RETURNING *',
        [status, reviewerId, sanitizeOptionalText(reason) || null, requestId],
      );
      if (!result.rows[0])
        throw new AppError(404, 'Announcement request not found');
      await client.query(
        'INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, reason) VALUES ($1,$2,$3,$4,$5)',
        [
          reviewerId,
          `announcement:${status.toLowerCase()}`,
          'announcement_request',
          requestId,
          sanitizeOptionalText(reason) || null,
        ],
      );
      return result.rows[0];
    });
  }
  static async listPosts(params: {
    category?: string;
    page: number;
    limit: number;
  }) {
    const values: unknown[] = [];
    const filters = ['is_published = true'];
    if (params.category) {
      values.push(params.category);
      filters.push(`category = $${values.length}`);
    }
    const where = `WHERE ${filters.join(' AND ')}`;
    const count = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM blog_posts ${where}`,
      values,
    );
    const offset = (params.page - 1) * params.limit;
    const posts = await query<any>(
      `SELECT post_id, slug, category, title, excerpt, content, cover_image_url, published_at FROM blog_posts ${where} ORDER BY published_at DESC NULLS LAST LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, params.limit, offset],
    );
    const total = Number(count.rows[0]?.count || 0);
    return {
      items: posts.rows,
      pagination: {
        total,
        page: params.page,
        limit: params.limit,
        totalPages: Math.ceil(total / params.limit),
      },
    };
  }
  static async toggleFavorite(userId: number, listingId: number) {
    return transaction(async (client) => {
      const listing = await client.query(
        'SELECT 1 FROM listings WHERE status = \'approved\' AND is_active = true AND listing_id = $1',
        [listingId],
      );
      if (!listing.rowCount) throw new AppError(404, 'Listing not found');
      const existing = await client.query(
        'DELETE FROM favorites WHERE user_id = $1 AND listing_id = $2 RETURNING listing_id',
        [userId, listingId],
      );
      if (existing.rowCount) return { saved: false, listingId };
      await client.query(
        'INSERT INTO favorites (user_id, listing_id) VALUES ($1,$2)',
        [userId, listingId],
      );
      return { saved: true, listingId };
    });
  }
  static async getFavorites(userId: number) {
    const result = await query<{ listing_id: number }>(
      'SELECT l.listing_id FROM favorites f JOIN listings l ON l.listing_id = f.listing_id WHERE f.user_id = $1 AND l.status = \'approved\' AND l.is_active = true ORDER BY f.created_at DESC',
      [userId],
    );
    const listings = await Promise.all(
      result.rows.map((row) =>
        ListingService.findById(row.listing_id, { publicOnly: true }),
      ),
    );
    return listings.filter((listing) => listing !== null);
  }
}
