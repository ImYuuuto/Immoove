import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../../src/config/db';
import { COOKIE_NAME } from '../../src/controllers/authController';
import { auth, permissionsForRole, requirePermission } from '../../src/middleware/auth';

jest.mock('../../src/config/db', () => ({ query: jest.fn() }));

const secret = 'test-secret-that-is-long-enough-for-jwt-tests';
const mockedQuery = query as jest.MockedFunction<typeof query>;

function createToken(sessionVersion: number) {
  return jwt.sign({ userId: 7, role: 'CLIENT', sessionVersion }, secret, {
    issuer: 'sidi-bouzid-api',
    audience: 'sidi-bouzid-web',
  });
}

async function authenticate(token: string) {
  process.env.JWT_SECRET = secret;
  const req = {
    cookies: { [COOKIE_NAME]: token },
    header: jest.fn(),
  } as unknown as Request;
  const next = jest.fn() as jest.MockedFunction<NextFunction>;
  await auth(req, {} as Response, next);
  return { req, next };
}

describe('JWT session version validation', () => {
  beforeEach(() => mockedQuery.mockReset());

  test('accepts a JWT whose version matches the server state', async () => {
    mockedQuery.mockResolvedValue({
      rows: [{ session_version: 3, role: 'CLIENT' }],
    } as never);

    const { req, next } = await authenticate(createToken(3));

    expect(req.user).toEqual({ userId: 7, role: 'CLIENT' });
    expect(req.authenticationSource).toBe('cookie');
    expect(next).toHaveBeenCalledWith();
  });

  test('rejects all JWTs issued before a password change', async () => {
    mockedQuery.mockResolvedValue({
      rows: [{ session_version: 4, role: 'CLIENT' }],
    } as never);

    const { req, next } = await authenticate(createToken(3));

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledWith();
  });

  test('passes session-store failures to the error handler', async () => {
    const databaseError = new Error('database unavailable');
    mockedQuery.mockRejectedValue(databaseError);

    const { next } = await authenticate(createToken(3));

    expect(next).toHaveBeenCalledWith(databaseError);
  });
});

describe('staff permissions', () => {
  test('grants staff capabilities only to normalized administrators', () => {
    expect(permissionsForRole('ADMIN')).toEqual(expect.arrayContaining(['analytics.read', 'user.manage', 'content.moderate']));
    expect(permissionsForRole('OWNER')).toEqual([]);
    expect(permissionsForRole('CLIENT')).toEqual([]);
    expect(permissionsForRole('moderator')).toEqual([]);
  });

  test('rejects an owner from administrator analytics', () => {
    const req = { user: { userId: 9, role: 'OWNER' } } as Request;
    const next = jest.fn();
    requirePermission('analytics.read')(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });
});
