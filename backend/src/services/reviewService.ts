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
       WHERE b.user_id=$1 ORDER BY r.created_at DESC`,
      [userId],
    );
    return result.rows.map(mapReview);
  }

  static async create(userId: number, data: { bookingId: number; rating: number; comment: string }) {
    return transaction(async client => {
      const booking = await client.query<{ user_id: number; status: string }>(
        'SELECT user_id,status FROM bookings WHERE booking_id=$1 FOR UPDATE', [data.bookingId],
      );
      if (!booking.rows[0]) throw new AppError(404, 'Booking not found');
      if (booking.rows[0].user_id !== userId) throw new AppError(403, 'You cannot review this booking');
      if (booking.rows[0].status !== 'completed')
        throw new AppError(409, 'Only completed bookings can be reviewed');
      const existing = await client.query('SELECT 1 FROM reviews WHERE booking_id=$1 LIMIT 1', [data.bookingId]);
      if (existing.rowCount) throw new AppError(409, 'This booking has already been reviewed');
      const result = await client.query<any>(
        `INSERT INTO reviews(booking_id,rating,comment) VALUES($1,$2,$3)
         RETURNING review_id,booking_id,rating,comment,created_at`,
        [data.bookingId,data.rating,sanitizeRequiredText(data.comment,'comment')],
      );
      return mapReview(result.rows[0]);
    });
  }

  static async update(reviewId: number, userId: number, role: string, data: { rating?: number; comment?: string }) {
    const result = await query<any>(
      `UPDATE reviews r SET
         rating=COALESCE($1,r.rating), comment=COALESCE($2,r.comment)
       FROM bookings b
       WHERE r.review_id=$3 AND b.booking_id=r.booking_id
         AND ($4='ADMIN' OR b.user_id=$5)
       RETURNING r.review_id,r.booking_id,r.rating,r.comment,r.created_at`,
      [data.rating ?? null,sanitizeOptionalText(data.comment) || null,reviewId,role,userId],
    );
    if (!result.rows[0]) throw new AppError(404, 'Review not found or access denied');
    return mapReview(result.rows[0]);
  }

  static async delete(reviewId: number, userId: number, role: string) {
    const result = await query(
      `DELETE FROM reviews r USING bookings b
       WHERE r.review_id=$1 AND b.booking_id=r.booking_id
         AND ($2='ADMIN' OR b.user_id=$3) RETURNING r.review_id`,
      [reviewId,role,userId],
    );
    if (!result.rowCount) throw new AppError(404, 'Review not found or access denied');
  }
}
