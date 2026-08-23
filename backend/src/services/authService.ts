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
        'INSERT INTO users (first_name, last_name, email, password_hash, phone, role) VALUES ($1,$2,$3,$4,$5,$6) RETURNING user_id, first_name, last_name, email, phone, role',
        [
          data.first_name,
          data.last_name,
          data.email,
          passwordHash,
          data.phone || null,
          'CLIENT',
        ],
      );
      return result.rows[0];
    } catch (error: any) {
      if (error?.code === '23505')
        throw new AppError(409, 'An account with this email already exists');
      throw error;
    }
  }

  static async authenticate(email: string, password: string) {
    const result = await query<any>(
      'SELECT user_id, first_name, last_name, email, phone, role, password_hash FROM users WHERE email = $1',
      [email],
    );
    const user = result.rows[0];
    if (
      !user?.password_hash ||
      !(await verifyPassword(password, user.password_hash))
    )
      throw new AppError(401, 'Invalid email or password');
    return {
      userId: user.user_id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };
  }
}
