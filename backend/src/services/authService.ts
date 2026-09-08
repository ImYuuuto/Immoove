import { promisify } from 'node:util';
import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { query, transaction } from '../config/db';
import { AppError } from '../utils/errorHandler';
import { sanitizeOptionalText, sanitizeRequiredText } from '../utils/sanitize';

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
  static async verifyCurrentPassword(userId: number, password: string): Promise<void> {
    const result = await query<{ password_hash: string }>(
      'SELECT password_hash FROM users WHERE user_id = ?',
      [userId],
    );
    if (
      !result.rows[0]?.password_hash ||
      !(await verifyPassword(password, result.rows[0].password_hash))
    ) {
      throw new AppError(401, 'Current password is incorrect');
    }
  }

  static async register(data: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    phone?: string;
    acceptTerms: true;
    language: 'en' | 'fr' | 'ar';
  }) {
    const passwordHash = await hashPassword(data.password);
    const firstName = sanitizeRequiredText(data.first_name, 'first_name');
    const lastName = sanitizeRequiredText(data.last_name, 'last_name');
    const phone = sanitizeOptionalText(data.phone);
    const acceptedAt = new Date();
    try {
      const user = await transaction(async (client) => {
        const document = await client.query<{ version: string }>(
          `SELECT version FROM legal_documents
           WHERE document_type = 'terms' AND is_current = true
           FOR SHARE`,
        );
        if (!document.rows[0])
          throw new AppError(503, 'Registration is unavailable until Terms of Use are configured');
        const inserted = await client.query(
          `INSERT INTO users
           (first_name, last_name, email, password_hash, phone, role, terms_accepted_at, terms_version)
           VALUES (?,?,?,?,?,'CLIENT',?,?)`,
          [
            firstName,
            lastName,
            data.email,
            passwordHash,
            phone || null,
            acceptedAt,
            document.rows[0].version,
          ],
        );
        if (!inserted.insertId)
          throw new AppError(500, 'Account could not be created');
        await client.query(
          `INSERT INTO user_legal_consents
           (user_id, document_type, document_version, accepted_at, accepted_language)
           VALUES (?,'terms',?,?,?)`,
          [inserted.insertId, document.rows[0].version, acceptedAt, data.language],
        );
        const created = await client.query<any>(
          `SELECT user_id, first_name, last_name, email, phone, role,
                  session_version, terms_accepted_at, terms_version
           FROM users WHERE user_id = ?`,
          [inserted.insertId],
        );
        if (!created.rows[0])
          throw new AppError(500, 'Created account could not be loaded');
        return created.rows[0];
      });
      return {
        userId: user.user_id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        sessionVersion: user.session_version,
        requiresTermsAcceptance: false,
      };
    } catch (error: any) {
      if (error?.code === 'ER_DUP_ENTRY' || error?.errno === 1062)
        throw new AppError(409, 'An account with this email already exists');
      throw error;
    }
  }

  static async authenticate(email: string, password: string) {
    const result = await query<any>(
      `SELECT u.user_id, u.first_name, u.last_name, u.email, u.phone, u.role,
       u.account_status, u.password_hash, u.session_version,
       EXISTS (
         SELECT 1 FROM legal_documents d
         WHERE d.document_type='terms' AND d.is_current=true AND d.requires_reacceptance=true
           AND NOT EXISTS (
             SELECT 1 FROM user_legal_consents c
             WHERE c.user_id=u.user_id AND c.document_type=d.document_type
               AND c.document_version=d.version
           )
       ) AS requires_terms_acceptance
       FROM users u WHERE u.email = ?`,
      [email],
    );
    const user = result.rows[0];
    const passwordMatches = await verifyPassword(
      password,
      user?.password_hash || DUMMY_PASSWORD_HASH,
    );
    if (!user?.password_hash || !passwordMatches)
      throw new AppError(401, 'Invalid email or password');
    if (user.account_status === 'suspended')
      throw new AppError(403, 'Account is suspended');
    return {
      userId: user.user_id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      sessionVersion: user.session_version,
      requiresTermsAcceptance: Boolean(user.requires_terms_acceptance),
    };
  }

  static async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    await this.verifyCurrentPassword(userId, currentPassword);

    const passwordHash = await hashPassword(newPassword);
    const updated = await query(
      'UPDATE users SET password_hash = ?, session_version = session_version + 1 WHERE user_id = ?',
      [passwordHash, userId],
    );
    if (updated.rowCount !== 1) throw new AppError(404, 'User not found');
  }
}
