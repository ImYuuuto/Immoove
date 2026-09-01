import { query, transaction } from '../config/db';
import { AppError } from '../utils/errorHandler';
import { decodeStoredText, sanitizeRequiredText } from '../utils/sanitize';
import { AuthService } from './authService';

type ProfileRow = {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  role: string;
  avatar_url: string | null;
};

function mapProfile(row: ProfileRow) {
  return {
    userId: row.user_id,
    firstName: decodeStoredText(row.first_name || ''),
    lastName: decodeStoredText(row.last_name || ''),
    email: row.email,
    phone: row.phone ? decodeStoredText(row.phone) : null,
    role: row.role,
    avatarUrl: row.avatar_url,
  };
}

export class ProfileService {
  static async get(userId: number) {
    const result = await query<ProfileRow>(
      'SELECT user_id, first_name, last_name, email, phone, role, avatar_url FROM users WHERE user_id = $1',
      [userId],
    );
    if (!result.rows[0]) throw new AppError(404, 'Profile not found');
    return mapProfile(result.rows[0]);
  }

  static async update(userId: number, firstName: string, lastName: string) {
    const result = await query<ProfileRow>(
      'UPDATE users SET first_name = $1, last_name = $2 WHERE user_id = $3 RETURNING user_id, first_name, last_name, email, phone, role, avatar_url',
      [
        sanitizeRequiredText(firstName, 'firstName'),
        sanitizeRequiredText(lastName, 'lastName'),
        userId,
      ],
    );
    if (!result.rows[0]) throw new AppError(404, 'Profile not found');
    return mapProfile(result.rows[0]);
  }

  static async updateAvatar(userId: number, avatarUrl: string) {
    const result = await query<ProfileRow>(
      `UPDATE users SET avatar_url = $1 WHERE user_id = $2
       RETURNING user_id, first_name, last_name, email, phone, role, avatar_url`,
      [avatarUrl, userId],
    );
    if (!result.rows[0]) throw new AppError(404, 'Profile not found');
    return mapProfile(result.rows[0]);
  }

  static async summary(userId: number) {
    const result = await query<any>(
      `SELECT
        (SELECT COUNT(*)::int FROM bookings WHERE user_id = $1) AS booking_count,
        (SELECT COUNT(*)::int FROM favorites WHERE user_id = $1) AS favorite_count,
        (SELECT COUNT(*)::int FROM listings WHERE provider_id = $1 AND archived_at IS NULL) AS listing_count,
        (SELECT COUNT(*)::int FROM bookings
          WHERE user_id = $1 AND status NOT IN ('cancelled','rejected','refunded')
            AND end_date > now()) AS active_trip_count,
        (SELECT booking_id FROM bookings
          WHERE user_id = $1 AND status NOT IN ('cancelled','rejected','refunded')
            AND end_date > now()
          ORDER BY start_date ASC LIMIT 1) AS next_booking_id`,
      [userId],
    );
    const row = result.rows[0];
    return {
      bookingCount: Number(row.booking_count || 0),
      favoriteCount: Number(row.favorite_count || 0),
      listingCount: Number(row.listing_count || 0),
      activeTripCount: Number(row.active_trip_count || 0),
      nextBookingId: row.next_booking_id ? Number(row.next_booking_id) : null,
    };
  }

  static async updateContact(
    userId: number,
    data: { email?: string; phone?: string; currentPassword: string },
  ) {
    await AuthService.verifyCurrentPassword(userId, data.currentPassword);
    try {
      const result = await query<ProfileRow>(
        `UPDATE users
         SET email = COALESCE($1, email), phone = COALESCE($2, phone),
             session_version = session_version + CASE WHEN $1 IS NULL OR $1 = email THEN 0 ELSE 1 END
         WHERE user_id = $3
         RETURNING user_id, first_name, last_name, email, phone, role, avatar_url`,
        [data.email?.toLowerCase() || null, data.phone || null, userId],
      );
      if (!result.rows[0]) throw new AppError(404, 'Profile not found');
      return mapProfile(result.rows[0]);
    } catch (error: any) {
      if (error?.code === '23505')
        throw new AppError(409, 'An account with this email already exists');
      throw error;
    }
  }

  static async deactivate(userId: number, currentPassword: string): Promise<void> {
    await AuthService.verifyCurrentPassword(userId, currentPassword);
    await transaction(async (client) => {
      const locked = await client.query(
        'SELECT user_id, role FROM users WHERE user_id = $1 FOR UPDATE',
        [userId],
      );
      if (!locked.rowCount) throw new AppError(404, 'Profile not found');
      if (locked.rows[0].role === 'ADMIN') {
        const admins = await client.query(
          `SELECT COUNT(*)::int AS count FROM users
           WHERE role = 'ADMIN' AND account_status = 'active'`,
        );
        if (Number(admins.rows[0]?.count || 0) <= 1)
          throw new AppError(409, 'The last active administrator cannot delete their account');
      }
      const obligations = await client.query(
        `SELECT EXISTS (
           SELECT 1 FROM bookings
           WHERE user_id = $1 AND status NOT IN ('cancelled','rejected','refunded')
             AND end_date > now()
         ) OR EXISTS (
           SELECT 1 FROM bookings b JOIN listings l ON l.listing_id = b.listing_id
           WHERE l.provider_id = $1 AND b.status IN ('pending','processing','confirmed')
             AND b.end_date > now()
         ) AS blocked`,
        [userId],
      );
      if (obligations.rows[0]?.blocked)
        throw new AppError(409, 'Resolve active bookings before deleting your account');
      await client.query(
        `UPDATE users SET account_status = 'suspended', session_version = session_version + 1
         WHERE user_id = $1`,
        [userId],
      );
    });
  }
}
