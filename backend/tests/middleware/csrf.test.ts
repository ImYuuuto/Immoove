import { NextFunction, Request, Response } from 'express';
import {
  CSRF_COOKIE_NAME,
  csrfProtection,
  issueCsrfToken,
} from '../../src/middleware/csrf';
import { AppError } from '../../src/utils/errorHandler';

function runMiddleware(request: Partial<Request>) {
  const next = jest.fn() as jest.MockedFunction<NextFunction>;
  csrfProtection(request as Request, {} as Response, next);
  return next;
}

describe('CSRF protection', () => {
  test('generates a random token and writes it to a readable cookie', () => {
    const cookie = jest.fn();
    const clearCookie = jest.fn();
    const first = issueCsrfToken({ cookie, clearCookie } as unknown as Response);
    const second = issueCsrfToken({ cookie, clearCookie } as unknown as Response);

    expect(first).toHaveLength(43);
    expect(second).not.toBe(first);
    expect(cookie).toHaveBeenCalledWith(
      CSRF_COOKIE_NAME,
      first,
      expect.objectContaining({ httpOnly: false, sameSite: 'lax', path: '/' }),
    );
    expect(clearCookie).toHaveBeenCalledWith(
      'sidibouzid_csrf',
      expect.objectContaining({ httpOnly: false, sameSite: 'lax', path: '/' }),
    );
  });

  test('accepts matching tokens for cookie-authenticated state changes', () => {
    const token = 'matching-csrf-token';
    const next = runMiddleware({
      method: 'POST',
      authenticationSource: 'cookie',
      cookies: { [CSRF_COOKIE_NAME]: token },
      header: jest.fn().mockReturnValue(token),
    });

    expect(next).toHaveBeenCalledWith();
  });

  test.each([
    ['missing', undefined],
    ['different', 'wrong-token'],
  ])('rejects %s CSRF headers', (_label, headerToken) => {
    const next = runMiddleware({
      method: 'DELETE',
      authenticationSource: 'cookie',
      cookies: { [CSRF_COOKIE_NAME]: 'expected-token' },
      header: jest.fn().mockReturnValue(headerToken),
    });

    const error = next.mock.calls[0][0] as unknown as AppError;
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(403);
  });

  test.each([
    ['GET', 'cookie'],
    ['POST', 'bearer'],
    ['PATCH', undefined],
  ])(
    'does not require a token for %s requests using %s auth',
    (method, source) => {
      const next = runMiddleware({
        method,
        authenticationSource: source as Request['authenticationSource'],
        cookies: {},
        header: jest.fn(),
      });

      expect(next).toHaveBeenCalledWith();
    },
  );
});
