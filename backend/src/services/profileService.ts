import { query, transaction } from '../config/db';
import { AppError } from '../utils/errorHandler';
import { decodeStoredText, sanitizeRequiredText } from '../utils/sanitize';

type ProfileRow = {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  avatar_url: string | null;
};

function mapProfile(row: ProfileRow) {
  return {
    userId: row.user_id,
    firstName: decodeStoredText(row.first_name || ''),
    lastName: decodeStoredText(row.last_name || ''),
    email: row.email,
    role: row.role,
    avatarUrl: row.avatar_url,
  };
}

export class ProfileService {
  static async get(userId: number) {
    const result = await query<ProfileRow>(
      'SELECT user_id, first_name, last_name, email, role, avatar_url FROM users WHERE user_id = $1',
      [userId],
    );
    if (!result.rows[0]) throw new AppError(404, 'Profile not found');
    return mapProfile(result.rows[0]);
  }

  static async update(userId: number, firstName: string, lastName: string) {
    const result = await query<ProfileRow>(
      'UPDATE users SET first_name = $1, last_name = $2 WHERE user_id = $3 RETURNING user_id, first_name, last_name, email, role, avatar_url',
      [
        sanitizeRequiredText(firstName, 'firstName'),
        sanitizeRequiredText(lastName, 'lastName'),
        userId,
      ],
    );
    if (!result.rows[0]) throw new AppError(404, 'Profile not found');
    return mapProfile(result.rows[0]);
  }

  static async delete(userId: number): Promise<void> {
    await transaction(async (client) => {
      const locked = await client.query(
        'SELECT user_id FROM users WHERE user_id = $1 FOR UPDATE',
        [userId],
      );
      if (!locked.rowCount) throw new AppError(404, 'Profile not found');
      await client.query('DELETE FROM users WHERE user_id = $1', [userId]);
    });
  }
}
