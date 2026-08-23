import { query, transaction } from '../config/db';
import { AppError } from '../utils/errorHandler';
export class BookingService {
  static async findAll(userId?: number) {
    const result = await query<any>(
      'SELECT booking_id, listing_id, user_id, start_date, end_date, total, created_at FROM bookings WHERE ($1::int IS NULL OR user_id = $1) ORDER BY created_at DESC',
      [userId || null],
    );
    return result.rows.map((row) => ({
      bookingId: row.booking_id,
      listingId: row.listing_id,
      userId: row.user_id,
      startDate: row.start_date,
      endDate: row.end_date,
      total: Number(row.total),
      createdAt: row.created_at,
    }));
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
}
