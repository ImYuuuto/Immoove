import { query } from '../config/db';
import { decodeStoredText } from '../utils/sanitize';

export class OwnerDashboardService {
  static async get(ownerId: number) {
    const [summary, listings] = await Promise.all([
      query<any>(
        `SELECT
          COUNT(*)::int AS total_properties,
          COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
          COUNT(*) FILTER (WHERE status = 'approved')::int AS approved,
          COUNT(*) FILTER (WHERE status = 'rejected')::int AS rejected,
          COUNT(*) FILTER (WHERE status = 'changes_requested')::int AS changes_requested,
          COUNT(*) FILTER (WHERE is_active = true)::int AS active,
          COALESCE(SUM((SELECT COUNT(*) FROM bookings b WHERE b.listing_id = l.listing_id)), 0)::int AS total_bookings,
          COALESCE(SUM((SELECT COUNT(*) FROM bookings b WHERE b.listing_id = l.listing_id AND b.status IN ('pending','processing'))), 0)::int AS awaiting_bookings,
          COALESCE(SUM((SELECT COALESCE(SUM(b.total), 0) FROM bookings b WHERE b.listing_id = l.listing_id AND b.status IN ('confirmed','completed'))), 0)::numeric AS gross_booking_value
         FROM listings l WHERE l.provider_id = $1`,
        [ownerId],
      ),
      query<any>(
        `SELECT l.listing_id, l.title, l.status, l.is_active, l.base_price, l.pricing_unit,
                l.cover_image_url, l.created_at, l.updated_at, l.rejection_reason,
                pt.name AS property_type,
                COUNT(DISTINCT b.booking_id)::int AS bookings,
                COUNT(DISTINCT b.booking_id) FILTER (WHERE b.status IN ('pending','processing'))::int AS awaiting_bookings,
                COALESCE(AVG(r.rating), 0)::numeric AS average_rating,
                COUNT(DISTINCT r.review_id)::int AS review_count
         FROM listings l
         LEFT JOIN property_types pt ON pt.property_type_id = l.property_type_id
         LEFT JOIN bookings b ON b.listing_id = l.listing_id
         LEFT JOIN reviews r ON r.booking_id = b.booking_id
         WHERE l.provider_id = $1
         GROUP BY l.listing_id, pt.name
         ORDER BY l.updated_at DESC`,
        [ownerId],
      ),
    ]);
    const row = summary.rows[0] || {};
    return {
      statistics: {
        totalProperties: Number(row.total_properties || 0),
        pending: Number(row.pending || 0),
        approved: Number(row.approved || 0),
        rejected: Number(row.rejected || 0),
        changesRequested: Number(row.changes_requested || 0),
        active: Number(row.active || 0),
        totalBookings: Number(row.total_bookings || 0),
        awaitingBookings: Number(row.awaiting_bookings || 0),
        grossBookingValue: Number(row.gross_booking_value || 0),
      },
      properties: listings.rows.map(item => ({
        listingId: item.listing_id,
        title: decodeStoredText(item.title),
        status: item.status,
        isActive: item.is_active,
        basePrice: Number(item.base_price || 0),
        pricingUnit: item.pricing_unit,
        coverImageUrl: item.cover_image_url,
        propertyType: item.property_type ? decodeStoredText(item.property_type) : null,
        bookings: Number(item.bookings || 0),
        awaitingBookings: Number(item.awaiting_bookings || 0),
        averageRating: Number(item.average_rating || 0),
        reviewCount: Number(item.review_count || 0),
        adminNote: item.rejection_reason ? decodeStoredText(item.rejection_reason) : null,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      })),
    };
  }
}
