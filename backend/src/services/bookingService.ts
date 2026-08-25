import { query, transaction } from '../config/db';
import { AppError } from '../utils/errorHandler';
import { decodeStoredText, sanitizeRequiredText } from '../utils/sanitize';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

export function billableUnits(
  startDate: string | Date,
  endDate: string | Date,
  pricingUnit?: string | null,
  serviceType?: string | null,
) {
  const duration = new Date(endDate).getTime() - new Date(startDate).getTime();
  const unit = (pricingUnit || '').toLowerCase();
  if (unit.includes('hour') || unit.includes('heure'))
    return Math.ceil(duration / MILLISECONDS_PER_HOUR);
  if (
    unit.includes('service') ||
    unit.includes('fixed') ||
    unit.includes('session') ||
    (!unit && ['RESTAURANT_CAFE', 'ACTIVITY'].includes(serviceType || ''))
  )
    return 1;
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
    };
  }

  static async findAll(userId?: number) {
    const result = await query<any>(
      'SELECT booking_id, listing_id, user_id, start_date, end_date, total, contact_first_name, contact_last_name, contact_email, contact_phone, status, payment_status, currency, created_at FROM bookings WHERE ($1::int IS NULL OR user_id = $1) ORDER BY created_at DESC',
      [userId || null],
    );
    return result.rows.map(this.map);
  }

  static async findById(bookingId: number) {
    const result = await query<any>(
      'SELECT booking_id, listing_id, user_id, start_date, end_date, total, contact_first_name, contact_last_name, contact_email, contact_phone, status, payment_status, currency, created_at FROM bookings WHERE booking_id = $1',
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
        'SELECT status, is_active, pricing_unit, service_type FROM listings WHERE listing_id = $1 FOR UPDATE',
        [data.listingId],
      );
      if (!listing.rows[0]) throw new AppError(404, 'Listing not found');
      if (listing.rows[0].status !== 'approved' || !listing.rows[0].is_active)
        throw new AppError(409, 'Listing is not available for booking');
      const conflict = await client.query(
        'SELECT 1 FROM bookings WHERE listing_id = $1 AND start_date < $3 AND end_date > $2 LIMIT 1',
        [data.listingId, data.startDate, data.endDate],
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
        'INSERT INTO bookings (listing_id, user_id, start_date, end_date, total, contact_first_name, contact_last_name, contact_email, contact_phone) VALUES ($1,$2,$3,$4,(SELECT base_price * $5 FROM listings WHERE listing_id = $1),$6,$7,$8,$9) RETURNING booking_id, listing_id, user_id, start_date, end_date, total, contact_first_name, contact_last_name, contact_email, contact_phone, created_at',
        [
          data.listingId,
          data.userId,
          data.startDate,
          data.endDate,
          units,
          sanitizeRequiredText(data.firstName, 'firstName'),
          sanitizeRequiredText(data.lastName, 'lastName'),
          data.email.toLowerCase(),
          sanitizeRequiredText(data.phone, 'phone'),
        ],
      );
      if (!result.rows[0])
        throw new AppError(500, 'Booking could not be created');
      return result.rows[0];
    });
    return this.map(row);
  }

  static async update(
    bookingId: number,
    data: Partial<{
      listingId: number;
      userId: number;
      startDate: Date;
      endDate: Date;
      status: 'confirmed' | 'cancelled' | 'completed' | 'refunded';
      paymentStatus: 'unpaid' | 'pending' | 'paid' | 'refunded';
    }>,
  ) {
    return transaction(async (client) => {
      const currentResult = await client.query<any>(
        'SELECT * FROM bookings WHERE booking_id = $1 FOR UPDATE',
        [bookingId],
      );
      const current = currentResult.rows[0];
      if (!current) throw new AppError(404, 'Booking not found');
      const listingId = data.listingId ?? current.listing_id;
      const userId = data.userId ?? current.user_id;
      const startDate = data.startDate ?? current.start_date;
      const endDate = data.endDate ?? current.end_date;
      if (new Date(endDate) <= new Date(startDate))
        throw new AppError(400, 'endDate must be after startDate');
      const listing = await client.query<{
        status: string;
        is_active: boolean;
        pricing_unit: string | null;
        service_type: string | null;
      }>(
        'SELECT status, is_active, pricing_unit, service_type FROM listings WHERE listing_id = $1 FOR UPDATE',
        [listingId],
      );
      if (!listing.rows[0]) throw new AppError(404, 'Listing not found');
      if (listing.rows[0].status !== 'approved' || !listing.rows[0].is_active)
        throw new AppError(409, 'Listing is not available for booking');
      const conflict = await client.query(
        'SELECT 1 FROM bookings WHERE listing_id = $1 AND booking_id <> $2 AND start_date < $4 AND end_date > $3 LIMIT 1',
        [listingId, bookingId, startDate, endDate],
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
        `UPDATE bookings SET listing_id = $1, user_id = $2, start_date = $3, end_date = $4,
          total = (SELECT base_price * $5 FROM listings WHERE listing_id = $1),
          status = COALESCE($6, status), payment_status = COALESCE($7, payment_status),
          cancelled_at = CASE WHEN $6 = 'cancelled' THEN now() WHEN $6 IS NOT NULL THEN NULL ELSE cancelled_at END
         WHERE booking_id = $8
         RETURNING booking_id, listing_id, user_id, start_date, end_date, total, status, payment_status, currency, created_at`,
        [listingId, userId, startDate, endDate, units, data.status || null, data.paymentStatus || null, bookingId],
      );
      return this.map(result.rows[0]);
    });
  }

  static async delete(bookingId: number) {
    const result = await query(
      'DELETE FROM bookings WHERE booking_id = $1 RETURNING booking_id',
      [bookingId],
    );
    if (!result.rowCount) throw new AppError(404, 'Booking not found');
  }
}
