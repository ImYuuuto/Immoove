import { query } from '../config/db';
import { User } from '../types/db';
export class UserService {
  static async findAll(): Promise<User[]> {
    const result = await query<any>(
      'SELECT user_id, first_name, last_name, email, phone, role, created_at FROM users ORDER BY created_at DESC',
    );
    return result.rows.map((row) => ({
      userId: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      role: row.role,
      createdAt: row.created_at,
    }));
  }
  static async findById(id: number) {
    const result = await query<any>(
      'SELECT user_id, first_name, last_name, email, phone, role, created_at FROM users WHERE user_id = $1',
      [id],
    );
    const row = result.rows[0];
    return row
      ? {
          userId: row.user_id,
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email,
          phone: row.phone,
          role: row.role,
          createdAt: row.created_at,
        }
      : null;
  }
}
