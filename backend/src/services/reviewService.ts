import { query, transaction } from '../config/db';
import { AppError } from '../utils/errorHandler';
import { decodeStoredText, sanitizeOptionalText, sanitizeRequiredText } from '../utils/sanitize';

const mapReview = (row: any) => ({
  reviewId: row.review_id,
  bookingId: row.booking_id,
  rating: row.rating,
  comment: decodeStoredText(row.comment || ''),
  createdAt: row.created_at,
});

export class ReviewService {
  static async mine(userId: number) {
    const result = await query<any>(
      `SELECT r.review_id,r.booking_id,r.rating,r.comment,r.created_at
       FROM reviews r JOIN bookings b ON b.booking_id=r.booking_id
       WHERE b.user_id=? ORDER BY r.created_at DESC`,
      [userId],
    );
    return result.rows.map(mapReview);
  }

  static async create(userId: number, data: { bookingId: number; rating: number; comment: string }) {
    return transaction(async client => {
      const booking = await client.query<{ user_id: number; status: string }>(
        'SELECT user_id,status FROM bookings WHERE booking_id=? FOR UPDATE', [data.bookingId],
      );
      if (!booking.rows[0]) throw new AppError(404, 'Booking not found');
      if (booking.rows[0].user_id !== userId) throw new AppError(403, 'You cannot review this booking');
      if (booking.rows[0].status !== 'completed')
        throw new AppError(409, 'Only completed bookings can be reviewed');
      const existing = await client.query('SELECT 1 FROM reviews WHERE booking_id=? LIMIT 1', [data.bookingId]);
      if (existing.rowCount) throw new AppError(409, 'This booking has already been reviewed');
      const result = await client.query(
        'INSERT INTO reviews(booking_id,rating,comment) VALUES(?,?,?)',
        [data.bookingId,data.rating,sanitizeRequiredText(data.comment,'comment')],
      );
      const created = await client.query<any>('SELECT review_id,booking_id,rating,comment,created_at FROM reviews WHERE review_id=?', [result.insertId]);
      return mapReview(created.rows[0]);
    });
  }

  static async update(reviewId: number, userId: number, role: string, data: { rating?: number; comment?: string }) {
    const result = await query(
      `UPDATE reviews r JOIN bookings b ON b.booking_id=r.booking_id SET
         r.rating=COALESCE(?,r.rating), r.comment=COALESCE(?,r.comment)
       WHERE r.review_id=? AND (?='ADMIN' OR b.user_id=?)`,
      [data.rating ?? null,sanitizeOptionalText(data.comment) || null,reviewId,role,userId],
    );
    if (!result.rowCount) throw new AppError(404, 'Review not found or access denied');
    const selected = await query<any>('SELECT review_id,booking_id,rating,comment,created_at FROM reviews WHERE review_id=?', [reviewId]);
    return mapReview(selected.rows[0]);
  }

  static async delete(reviewId: number, userId: number, role: string) {
    const result = await query(
      `DELETE r FROM reviews r JOIN bookings b ON b.booking_id=r.booking_id
       WHERE r.review_id=? AND (?='ADMIN' OR b.user_id=?)`,
      [reviewId,role,userId],
    );
    if (!result.rowCount) throw new AppError(404, 'Review not found or access denied');
  }
}
