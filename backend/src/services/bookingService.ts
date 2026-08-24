import { query, transaction } from '../config/db';
import { AppError } from '../utils/errorHandler';
export class BookingService {
  private static map(row: any) {
    return {
      bookingId: row.booking_id,
      listingId: row.listing_id,
      userId: row.user_id,
      startDate: row.start_date,
      endDate: row.end_date,
      total: Number(row.total),
      createdAt: row.created_at,
    };
  }

  static async findAll(userId?: number) {
    const result = await query<any>(
      'SELECT booking_id, listing_id, user_id, start_date, end_date, total, created_at FROM bookings WHERE ($1::int IS NULL OR user_id = $1) ORDER BY created_at DESC',
      [userId || null],
    );
    return result.rows.map(this.map);
  }

  static async findById(bookingId: number) {
    const result = await query<any>(
      'SELECT booking_id, listing_id, user_id, start_date, end_date, total, created_at FROM bookings WHERE booking_id = $1',
      [bookingId],
    );
    return result.rows[0] ? this.map(result.rows[0]) : null;
  }
  static async create(data: {
    listingId: number;
    userId: number;
    startDate: string | Date;
    endDate: string | Date;
    total: number;
  }) {
    if (new Date(data.endDate) <= new Date(data.startDate))
      throw new AppError(400, 'endDate must be after startDate');
    const row = await transaction(async (client) => {
      const listing = await client.query<{
        status: string;
        is_active: boolean;
      }>(
        'SELECT status, is_active FROM listings WHERE listing_id = $1 FOR UPDATE',
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
      const result = await client.query<any>(
        'INSERT INTO bookings (listing_id, user_id, start_date, end_date, total) VALUES ($1,$2,$3,$4,$5) RETURNING booking_id, listing_id, user_id, start_date, end_date, total, created_at',
        [data.listingId, data.userId, data.startDate, data.endDate, data.total],
      );
      if (!result.rows[0])
        throw new AppError(500, 'Booking could not be created');
      return result.rows[0];
    });
    return this.map(row);
  }

  static async update(
    bookingId: number,
    data: Partial<{ listingId: number; userId: number; startDate: Date; endDate: Date; total: number }>,
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
      const total = data.total ?? Number(current.total);
      if (new Date(endDate) <= new Date(startDate))
        throw new AppError(400, 'endDate must be after startDate');
      const listing = await client.query<{ status: string; is_active: boolean }>(
        'SELECT status, is_active FROM listings WHERE listing_id = $1',
        [listingId],
      );
      if (!listing.rows[0]) throw new AppError(404, 'Listing not found');
      if (listing.rows[0].status !== 'approved' || !listing.rows[0].is_active)
        throw new AppError(409, 'Listing is not available for booking');
      const conflict = await client.query(
        'SELECT 1 FROM bookings WHERE listing_id = $1 AND booking_id <> $2 AND start_date < $4 AND end_date > $3 LIMIT 1',
        [listingId, bookingId, startDate, endDate],
      );
      if (conflict.rowCount) throw new AppError(409, 'Listing is already booked for these dates');
      const result = await client.query<any>(
        'UPDATE bookings SET listing_id = $1, user_id = $2, start_date = $3, end_date = $4, total = $5 WHERE booking_id = $6 RETURNING booking_id, listing_id, user_id, start_date, end_date, total, created_at',
        [listingId, userId, startDate, endDate, total, bookingId],
      );
      return this.map(result.rows[0]);
    });
  }

  static async delete(bookingId: number) {
    const result = await query('DELETE FROM bookings WHERE booking_id = $1 RETURNING booking_id', [bookingId]);
    if (!result.rowCount) throw new AppError(404, 'Booking not found');
  }
}
