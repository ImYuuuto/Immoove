import { query } from '../config/db';
import { User } from '../types/db';
import { AppError } from '../utils/errorHandler';
export class UserService {
  static async findAll(params: { search?: string; page: number; limit: number }) {
    const values: unknown[] = [];
    let where = '';
    if (params.search) {
      values.push(`%${params.search}%`);
      where = `WHERE concat_ws(' ', first_name, last_name) ILIKE $1`;
    }
    const count = await query<{ count: string }>(`SELECT COUNT(*) AS count FROM users ${where}`, values);
    const offset = (params.page - 1) * params.limit;
    const result = await query<any>(
      `SELECT user_id, first_name, last_name, email, phone, role, created_at FROM users ${where} ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, params.limit, offset],
    );
    const items: User[] = result.rows.map((row) => ({
      userId: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      role: row.role,
      createdAt: row.created_at,
    }));
    const total = Number(count.rows[0]?.count || 0);
    return { items, pagination: { total, page: params.page, limit: params.limit, totalPages: Math.ceil(total / params.limit) } };
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

  static async setRole(id: number, role: 'user' | 'moderator', actorId: number) {
    if (id === actorId) throw new AppError(400, 'Administrators cannot change their own role');
    const result = await query<any>(
      `UPDATE users SET role = $1 WHERE user_id = $2 AND role NOT IN ('ADMIN', 'admin') RETURNING user_id, first_name, last_name, email, phone, role, created_at`,
      [role, id],
    );
    if (!result.rows[0]) throw new AppError(404, 'User not found or role cannot be changed');
    const row = result.rows[0];
    return { userId: row.user_id, firstName: row.first_name, lastName: row.last_name, email: row.email, phone: row.phone, role: row.role, createdAt: row.created_at };
  }
}
