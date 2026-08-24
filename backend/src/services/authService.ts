import { promisify } from 'node:util';
import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { query } from '../config/db';
import { AppError } from '../utils/errorHandler';

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
// Used when an email is unknown so failed logins take the same password-hashing
// path and return the same response as an incorrect password for a real user.
const DUMMY_PASSWORD_HASH =
  'scrypt:69ab14a80f7336784eab2402a731b445:9a70c9f53c53213a53ce18ab972dd607a0ad89b5bb49d319e9854ee810b983e76aaf645cbc3a49d42edbb382bd565a86b3dca00d437627c4e92b51956820eeca';

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `scrypt:${salt}:${derivedKey.toString('hex')}`;
}

async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const [algorithm, salt, hash] = storedHash.split(':');
  if (algorithm !== 'scrypt' || !salt || !hash) return false;
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  const expected = Buffer.from(hash, 'hex');
  return (
    expected.length === derivedKey.length &&
    timingSafeEqual(expected, derivedKey)
  );
}

export class AuthService {
  static async register(data: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    phone?: string;
  }) {
    const passwordHash = await hashPassword(data.password);
    try {
      const result = await query<any>(
        'INSERT INTO users (first_name, last_name, email, password_hash, phone, role) VALUES ($1,$2,$3,$4,$5,$6) RETURNING user_id, first_name, last_name, email, phone, role, session_version',
        [
          data.first_name,
          data.last_name,
          data.email,
          passwordHash,
          data.phone || null,
          'CLIENT',
        ],
      );
      const user = result.rows[0];
      return {
        userId: user.user_id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        sessionVersion: user.session_version,
      };
    } catch (error: any) {
      if (error?.code === '23505')
        throw new AppError(409, 'An account with this email already exists');
      throw error;
    }
  }

  static async authenticate(email: string, password: string) {
    const result = await query<any>(
      'SELECT user_id, first_name, last_name, email, phone, role, password_hash, session_version FROM users WHERE email = $1',
      [email],
    );
    const user = result.rows[0];
    const passwordMatches = await verifyPassword(
      password,
      user?.password_hash || DUMMY_PASSWORD_HASH,
    );
    if (!user?.password_hash || !passwordMatches)
      throw new AppError(401, 'Invalid email or password');
    return {
      userId: user.user_id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      sessionVersion: user.session_version,
    };
  }

  static async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const result = await query<{ password_hash: string }>(
      'SELECT password_hash FROM users WHERE user_id = $1',
      [userId],
    );
    const user = result.rows[0];
    if (
      !user?.password_hash ||
      !(await verifyPassword(currentPassword, user.password_hash))
    ) {
      throw new AppError(401, 'Current password is incorrect');
    }

    const passwordHash = await hashPassword(newPassword);
    const updated = await query(
      'UPDATE users SET password_hash = $1, session_version = session_version + 1 WHERE user_id = $2',
      [passwordHash, userId],
    );
    if (updated.rowCount !== 1) throw new AppError(404, 'User not found');
  }
}
