import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../../src/config/db';
import { COOKIE_NAME } from '../../src/controllers/authController';
import { JWT_AUDIENCE, JWT_ISSUER } from '../../src/config/authBrand';
import { auth, requireAdmin, requireRoles } from '../../src/middleware/auth';

jest.mock('../../src/config/db', () => ({ query: jest.fn() }));

const secret = 'test-secret-that-is-long-enough-for-jwt-tests';
const mockedQuery = query as jest.MockedFunction<typeof query>;

function createToken(sessionVersion: number, role = 'CLIENT') {
  return jwt.sign({ userId: 7, role, sessionVersion }, secret, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
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

    expect(req.user).toEqual({ userId: 7, role: 'CLIENT', requiresTermsAcceptance: false });
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

  test.each(['admin', 'moderator', 'staff', 'provider', 'user', 'HOST'])(
    'rejects non-canonical JWT role %s before querying the account',
    async (role) => {
      const { req } = await authenticate(createToken(3, role));
      expect(req.user).toBeUndefined();
      expect(mockedQuery).not.toHaveBeenCalled();
    },
  );
});

describe('canonical role boundaries', () => {
  test('rejects an owner from administrator analytics', () => {
    const req = { user: { userId: 9, role: 'OWNER', requiresTermsAcceptance: false } } as Request;
    const next = jest.fn();
    requireAdmin(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  test('allows owners but rejects clients on owner routes', () => {
    const ownerNext = jest.fn();
    const clientNext = jest.fn();
    const middleware = requireRoles('OWNER', 'ADMIN');
    middleware({ user: { userId: 2, role: 'OWNER', requiresTermsAcceptance: false } } as Request, {} as Response, ownerNext);
    middleware({ user: { userId: 3, role: 'CLIENT', requiresTermsAcceptance: false } } as Request, {} as Response, clientNext);
    expect(ownerNext).toHaveBeenCalledWith();
    expect(clientNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });
});

describe('renewed Terms acceptance', () => {
  test('blocks protected actions until the current version is accepted', () => {
    const req = {
      user: { userId: 7, role: 'CLIENT', requiresTermsAcceptance: true },
    } as Request;
    const next = jest.fn();
    requireAdmin(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 428 }));
  });
});
