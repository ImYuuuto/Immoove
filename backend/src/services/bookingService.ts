import { query, transaction } from '../config/db';
import { AppError } from '../utils/errorHandler';
import { decodeStoredText, sanitizeRequiredText } from '../utils/sanitize';
import { invalidateCache } from '../config/cache';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const TERMINAL_STATUSES = ['cancelled', 'rejected', 'refunded'];

export type BookingFilters = {
  state: 'all' | 'upcoming' | 'current' | 'past' | 'cancelled';
  cityId?: number;
  status?: string;
  search?: string;
  page: number;
  pageSize: number;
};

const bookingSelect = `SELECT b.booking_id, b.listing_id, b.user_id, b.start_date, b.end_date,
  b.total, b.contact_first_name, b.contact_last_name, b.contact_email, b.contact_phone,
  b.status, b.payment_status, b.currency, b.created_at,
  l.title AS listing_title, l.cover_image_url, l.guest_capacity,
  pt.name AS property_type_name, pt.slug AS property_type_slug,
  a.area_id, a.name AS area_name, c.city_id, c.name AS city_name,
  EXISTS (SELECT 1 FROM reviews r WHERE r.booking_id = b.booking_id) AS has_review
 FROM bookings b
 JOIN listings l ON l.listing_id = b.listing_id
 LEFT JOIN users u ON u.user_id = b.user_id
 LEFT JOIN property_types pt ON pt.property_type_id = l.property_type_id
 LEFT JOIN areas a ON a.area_id = l.area_id
 LEFT JOIN cities c ON c.city_id = a.city_id`;

export function billableUnits(
  startDate: string | Date,
  endDate: string | Date,
  pricingUnit?: string | null,
  _serviceType?: string | null,
) {
  const duration = new Date(endDate).getTime() - new Date(startDate).getTime();
  const unit = (pricingUnit || '').toLowerCase();
  if (unit.includes('month') || unit.includes('mois'))
    return Math.ceil(duration / (30 * MILLISECONDS_PER_DAY));
  return Math.ceil(duration / MILLISECONDS_PER_DAY);
}

export class BookingService {
  private static map(row: any) {
    return {
      bookingId: row.booking_id,
      listingId: row.listing_id,
      userId: row.user_id,
      startDate: row.start_date,
      endDate: row.end_date,
      total: Number(row.total),
      firstName: row.contact_first_name
        ? decodeStoredText(row.contact_first_name)
        : null,
      lastName: row.contact_last_name
        ? decodeStoredText(row.contact_last_name)
        : null,
      email: row.contact_email,
      phone: row.contact_phone ? decodeStoredText(row.contact_phone) : null,
      status: row.status,
      paymentStatus: row.payment_status,
      currency: row.currency || 'MAD',
      createdAt: row.created_at,
      listing: row.listing_title
        ? {
            title: decodeStoredText(row.listing_title),
            coverImageUrl: row.cover_image_url,
            guestCapacity: row.guest_capacity ? Number(row.guest_capacity) : null,
            propertyType: row.property_type_slug
              ? { name: row.property_type_name, slug: row.property_type_slug }
              : null,
            area: row.area_id ? { areaId: Number(row.area_id), name: row.area_name } : null,
            city: row.city_id ? { cityId: Number(row.city_id), name: row.city_name } : null,
          }
        : null,
      hasReview: Boolean(row.has_review),
      canReview: row.status === 'completed' && !row.has_review,
    };
  }

  static async findAll(userId: number | undefined, filters: BookingFilters) {
    const values: unknown[] = [];
    const clauses: string[] = [];
    if (userId !== undefined) {
      values.push(userId);
      clauses.push('b.user_id = ?');
    }
    if (filters.cityId) {
      values.push(filters.cityId);
      clauses.push('c.city_id = ?');
    }
    if (filters.status) {
      values.push(filters.status);
      clauses.push('b.status = ?');
    }
    if (filters.search) {
      values.push(...Array(7).fill(`%${filters.search}%`));
      clauses.push(`(
        l.title LIKE ?
        OR b.contact_first_name LIKE ?
        OR b.contact_last_name LIKE ?
        OR CONCAT_WS(' ', b.contact_first_name, b.contact_last_name) LIKE ?
        OR u.first_name LIKE ?
        OR u.last_name LIKE ?
        OR CONCAT_WS(' ', u.first_name, u.last_name) LIKE ?
      )`);
    }
    if (filters.state === 'cancelled') {
      clauses.push(`b.status IN (${TERMINAL_STATUSES.map((status) => `'${status}'`).join(',')})`);
    } else if (filters.state === 'upcoming') {
      clauses.push('b.start_date > now() AND b.status NOT IN (\'cancelled\',\'rejected\',\'refunded\')');
    } else if (filters.state === 'current') {
      clauses.push('b.start_date <= now() AND b.end_date > now() AND b.status NOT IN (\'cancelled\',\'rejected\',\'refunded\')');
    } else if (filters.state === 'past') {
      clauses.push('b.end_date <= now() AND b.status NOT IN (\'cancelled\',\'rejected\',\'refunded\')');
    }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const count = await query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM bookings b
       JOIN listings l ON l.listing_id = b.listing_id
       LEFT JOIN users u ON u.user_id = b.user_id
       LEFT JOIN areas a ON a.area_id = l.area_id
       LEFT JOIN cities c ON c.city_id = a.city_id ${where}`,
      values,
    );
    values.push(filters.pageSize, (filters.page - 1) * filters.pageSize);
    const result = await query<any>(
      `${bookingSelect} ${where}
       ORDER BY CASE WHEN b.end_date > now() THEN 0 ELSE 1 END, b.start_date ASC, b.created_at DESC
       LIMIT ? OFFSET ?`,
      values,
    );
    return {
      items: result.rows.map(this.map),
      total: Number(count.rows[0]?.total || 0),
      page: filters.page,
      pageSize: filters.pageSize,
    };
  }

  static async findById(bookingId: number) {
    const result = await query<any>(
      `${bookingSelect} WHERE b.booking_id = ?`,
      [bookingId],
    );
    return result.rows[0] ? this.map(result.rows[0]) : null;
  }
  static async create(data: {
    listingId: number;
    userId: number;
    startDate: string | Date;
    endDate: string | Date;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  }) {
    if (new Date(data.endDate) <= new Date(data.startDate))
      throw new AppError(400, 'endDate must be after startDate');
    const row = await transaction(async (client) => {
      const listing = await client.query<{
        status: string;
        is_active: boolean;
        pricing_unit: string | null;
        service_type: string | null;
      }>(
        'SELECT status, is_active, pricing_unit, service_type FROM listings WHERE listing_id = ? FOR UPDATE',
        [data.listingId],
      );
      if (!listing.rows[0]) throw new AppError(404, 'Listing not found');
      if (listing.rows[0].status !== 'approved' || !listing.rows[0].is_active)
        throw new AppError(409, 'Listing is not available for booking');
      const conflict = await client.query(
        'SELECT 1 FROM bookings WHERE listing_id = ? AND status NOT IN (\'rejected\',\'cancelled\',\'refunded\') AND start_date < ? AND end_date > ? LIMIT 1',
        [data.listingId, new Date(data.endDate), new Date(data.startDate)],
      );
      if (conflict.rowCount)
        throw new AppError(409, 'Listing is already booked for these dates');
      const units = billableUnits(
        data.startDate,
        data.endDate,
        listing.rows[0].pricing_unit,
        listing.rows[0].service_type,
      );
      const result = await client.query<any>(
        'INSERT INTO bookings (listing_id, user_id, start_date, end_date, total, contact_first_name, contact_last_name, contact_email, contact_phone) VALUES (?,?,?,?,(SELECT base_price * ? FROM listings WHERE listing_id = ?),?,?,?,?)',
        [
          data.listingId,
          data.userId,
          new Date(data.startDate),
          new Date(data.endDate),
          units,
          data.listingId,
          sanitizeRequiredText(data.firstName, 'firstName'),
          sanitizeRequiredText(data.lastName, 'lastName'),
          data.email.toLowerCase(),
          sanitizeRequiredText(data.phone, 'phone'),
        ],
      );
      if (!result.insertId) throw new AppError(500, 'Booking could not be created');
      const created = await client.query<any>('SELECT * FROM bookings WHERE booking_id=?', [result.insertId]);
      return created.rows[0];
    });
    await invalidateCache('listings', 'categories');
    return this.map(row);
  }

  static async update(
    bookingId: number,
    actorId: number,
    actorRole: string,
    data: Partial<{
      listingId: number;
      userId: number;
      startDate: Date;
      endDate: Date;
      status: 'pending' | 'processing' | 'confirmed' | 'cancelled' | 'completed' | 'rejected' | 'refunded';
      paymentStatus: 'unpaid' | 'pending' | 'paid' | 'refunded';
    }>,
  ) {
    const booking = await transaction(async (client) => {
      const currentResult = await client.query<any>(
        'SELECT * FROM bookings WHERE booking_id = ? FOR UPDATE',
        [bookingId],
      );
      const current = currentResult.rows[0];
      if (!current) throw new AppError(404, 'Booking not found');
      const isAdmin = actorRole === 'ADMIN';
      if (!isAdmin && current.user_id !== actorId)
        throw new AppError(403, 'You cannot update this booking');
      if (
        !isAdmin &&
        (data.status !== 'cancelled' ||
          Object.keys(data).some((key) => key !== 'status'))
      )
        throw new AppError(403, 'Clients may only cancel their own bookings');
      const listingId = data.listingId ?? current.listing_id;
      const userId = data.userId ?? current.user_id;
      const startDate = new Date(data.startDate ?? current.start_date);
      const endDate = new Date(data.endDate ?? current.end_date);
      if (new Date(endDate) <= new Date(startDate))
        throw new AppError(400, 'endDate must be after startDate');
      const listing = await client.query<{
        status: string;
        is_active: boolean;
        pricing_unit: string | null;
        service_type: string | null;
      }>(
        'SELECT status, is_active, pricing_unit, service_type FROM listings WHERE listing_id = ? FOR UPDATE',
        [listingId],
      );
      if (!listing.rows[0]) throw new AppError(404, 'Listing not found');
      if (listing.rows[0].status !== 'approved' || !listing.rows[0].is_active)
        throw new AppError(409, 'Listing is not available for booking');
      const conflict = await client.query(
        'SELECT 1 FROM bookings WHERE listing_id = ? AND booking_id <> ? AND start_date < ? AND end_date > ? LIMIT 1',
        [listingId, bookingId, endDate, startDate],
      );
      if (conflict.rowCount)
        throw new AppError(409, 'Listing is already booked for these dates');
      const units = billableUnits(
        startDate,
        endDate,
        listing.rows[0].pricing_unit,
        listing.rows[0].service_type,
      );
      const result = await client.query<any>(
        `UPDATE bookings SET listing_id = ?, user_id = ?, start_date = ?, end_date = ?,
          total = (SELECT base_price * ? FROM listings WHERE listing_id = ?),
          status = COALESCE(?, status), payment_status = COALESCE(?, payment_status),
          cancelled_at = CASE WHEN ? = 'cancelled' THEN now() WHEN ? IS NOT NULL THEN NULL ELSE cancelled_at END
         WHERE booking_id = ?`,
        [
          listingId,
          userId,
          startDate,
          endDate,
          units,
          listingId,
          data.status || null,
          data.paymentStatus || null,
          data.status || null,
          data.status || null,
          bookingId,
        ],
      );
      const updated = await client.query<any>('SELECT * FROM bookings WHERE booking_id=?', [bookingId]);
      return this.map(updated.rows[0]);
    });
    await invalidateCache('listings', 'categories');
    return booking;
  }

  static async delete(bookingId: number, actorRole: string) {
    if (actorRole !== 'ADMIN')
      throw new AppError(403, 'Only administrators may delete bookings');
    const result = await query(
      'DELETE FROM bookings WHERE booking_id = ?',
      [bookingId],
    );
    if (!result.rowCount) throw new AppError(404, 'Booking not found');
    await invalidateCache('listings', 'categories');
  }
}
