import { query } from '../config/db';
import { User } from '../types/db';
import { AppError } from '../utils/errorHandler';
export class UserService {
  static async findAll(params: { search?: string; page: number; limit: number }) {
    const values: unknown[] = [];
    let where = '';
    if (params.search) {
      values.push(`%${params.search}%`);
      where = 'WHERE (COALESCE(first_name, \'\') || \' \' || COALESCE(last_name, \'\')) ILIKE $1';
    }
    const count = await query<{ count: string }>(`SELECT COUNT(*) AS count FROM users ${where}`, values);
    const offset = (params.page - 1) * params.limit;
    const result = await query<any>(
      `SELECT user_id, first_name, last_name, email, phone, role, account_status, created_at FROM users ${where} ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, params.limit, offset],
    );
    const items: User[] = result.rows.map((row) => ({
      userId: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      role: row.role,
      accountStatus: row.account_status,
      createdAt: row.created_at,
    }));
    const total = Number(count.rows[0]?.count || 0);
    return { items, pagination: { total, page: params.page, limit: params.limit, totalPages: Math.ceil(total / params.limit) } };
  }
  static async findById(id: number) {
    const result = await query<any>(
      'SELECT user_id, first_name, last_name, email, phone, role, account_status, avatar_url, created_at FROM users WHERE user_id = $1',
      [id],
    );
    const row = result.rows[0];
    if (!row) return null;
    const bookings = await query<any>(
      `SELECT b.booking_id, b.listing_id, b.start_date, b.end_date, b.total,
              b.status, b.payment_status, b.currency, b.created_at,
              l.title AS listing_title, l.cover_image_url,
              r.review_id, r.rating, r.comment, r.created_at AS review_created_at
       FROM bookings b
       JOIN listings l ON l.listing_id = b.listing_id
       LEFT JOIN reviews r ON r.booking_id = b.booking_id
       WHERE b.user_id = $1
       ORDER BY b.start_date DESC, b.created_at DESC`,
      [id],
    );
    const items = bookings.rows.map((item) => ({
      bookingId: item.booking_id,
      listingId: item.listing_id,
      listingTitle: item.listing_title,
      coverImageUrl: item.cover_image_url,
      startDate: item.start_date,
      endDate: item.end_date,
      total: Number(item.total || 0),
      currency: item.currency || 'MAD',
      status: item.status,
      paymentStatus: item.payment_status,
      createdAt: item.created_at,
      isPrevious: new Date(item.end_date).getTime() <= Date.now(),
      review: item.review_id ? {
        reviewId: item.review_id,
        rating: Number(item.rating),
        comment: item.comment,
        createdAt: item.review_created_at,
      } : null,
    }));
    const ratings = items.flatMap((item) => item.review ? [item.review.rating] : []);
    return {
      userId: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      role: row.role,
      accountStatus: row.account_status,
      avatarUrl: row.avatar_url,
      createdAt: row.created_at,
      bookings: items,
      reviewCount: ratings.length,
      averageRating: ratings.length
        ? ratings.reduce((total, rating) => total + rating, 0) / ratings.length
        : null,
    };
  }

  static async setStatus(id: number, status: 'active' | 'suspended', actorId: number, actorRole: string, reason?: string) {
    if (actorRole !== 'ADMIN') throw new AppError(403, 'Administrator access required');
    if (id === actorId) throw new AppError(400, 'Administrators cannot change their own account status');
    const result = await query<any>(
      `UPDATE users SET account_status = $1, session_version = CASE WHEN $1 = 'suspended' THEN session_version + 1 ELSE session_version END
       WHERE user_id = $2 AND role <> 'ADMIN'
       RETURNING user_id, first_name, last_name, email, phone, role, account_status, created_at`,
      [status, id],
    );
    if (!result.rows[0]) throw new AppError(404, 'User not found or account cannot be changed');
    await query('INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, reason) VALUES ($1,$2,$3,$4,$5)', [actorId, `user:${status}`, 'user', id, reason || null]);
    const row = result.rows[0];
    return { userId: row.user_id, firstName: row.first_name, lastName: row.last_name, email: row.email, phone: row.phone, role: row.role, accountStatus: row.account_status, createdAt: row.created_at };
  }
}
