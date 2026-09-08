import { DatabaseClient, query, transaction } from '../../src/config/db';
import { AuthService } from '../../src/services/authService';

jest.mock('../../src/config/db', () => ({ query: jest.fn(), transaction: jest.fn() }));

const mockedQuery = query as jest.MockedFunction<typeof query>;
const mockedTransaction = transaction as jest.MockedFunction<typeof transaction>;
const storedPasswordHash =
  'scrypt:bef73c743464747f034322160ba2beb2:671de337b8359cc1754eb92fbd40911299d4a8962c740b6740822c3c45644eed555789063f3b2d790f88ee0cc5405564535f4557e4022f3420282d8d441ef5b0';

async function expectGenericLoginFailure(rows: unknown[]) {
  mockedQuery.mockResolvedValueOnce({ rows } as never);
  await expect(
    AuthService.authenticate('someone@example.com', 'incorrect-password'),
  ).rejects.toMatchObject({
    statusCode: 401,
    message: 'Invalid email or password',
  });
}

describe('AuthService login enumeration protection', () => {
  beforeEach(() => mockedQuery.mockReset());

  test('uses the generic response for an unknown email', async () => {
    await expectGenericLoginFailure([]);
  });

  test('uses the same generic response for an incorrect password', async () => {
    await expectGenericLoginFailure([{ password_hash: storedPasswordHash }]);
  });
});

describe('AuthService registration consent', () => {
  beforeEach(() => mockedTransaction.mockReset());

  test('creates the account and immutable consent in one transaction using one UTC instant', async () => {
    const acceptedAt = new Date('2026-08-30T12:00:00.000Z');
    jest.useFakeTimers().setSystemTime(acceptedAt);
    const client = {
      query: jest.fn()
        .mockResolvedValueOnce({ rows: [{ version: '1.0' }] })
        .mockResolvedValueOnce({ rows: [], rowCount: 1, insertId: 9 })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [{
          user_id: 9, first_name: 'Yassine', last_name: 'Example',
          email: 'yassine@example.com', phone: null, role: 'CLIENT',
          session_version: 0, terms_accepted_at: acceptedAt, terms_version: '1.0',
        }] }),
    };
    mockedTransaction.mockImplementationOnce(async (callback) =>
      callback(client as unknown as DatabaseClient),
    );

    try {
      await AuthService.register({
        first_name: 'Yassine', last_name: 'Example', email: 'yassine@example.com',
        password: 'a-secure-password', acceptTerms: true, language: 'fr',
      });
    } finally {
      jest.useRealTimers();
    }

    expect(client.query.mock.calls[1][0]).not.toContain('RETURNING');
    expect(client.query.mock.calls[1][1]).toEqual([
      'Yassine', 'Example', 'yassine@example.com', expect.stringMatching(/^scrypt:/),
      null, acceptedAt, '1.0',
    ]);
    expect(client.query.mock.calls[2][0]).toContain('user_legal_consents');
    expect(client.query.mock.calls[2][1]).toEqual([9, '1.0', acceptedAt, 'fr']);
    expect(client.query.mock.calls[3][1]).toEqual([9]);
  });

  test('does not complete registration when the consent insert fails', async () => {
    const consentError = new Error('consent insert failed');
    const client = {
      query: jest.fn()
        .mockResolvedValueOnce({ rows: [{ version: '1.0' }] })
        .mockResolvedValueOnce({ rows: [], rowCount: 1, insertId: 9 })
        .mockRejectedValueOnce(consentError),
    };
    mockedTransaction.mockImplementationOnce(async (callback) =>
      callback(client as unknown as DatabaseClient),
    );

    await expect(AuthService.register({
      first_name: 'Yassine', last_name: 'Example', email: 'yassine@example.com',
      password: 'a-secure-password', acceptTerms: true, language: 'en',
    })).rejects.toBe(consentError);
    expect(client.query).toHaveBeenCalledTimes(3);
  });

  test('maps a MySQL duplicate email error to the existing conflict response', async () => {
    mockedTransaction.mockRejectedValueOnce({ code: 'ER_DUP_ENTRY', errno: 1062 });

    await expect(AuthService.register({
      first_name: 'Yassine', last_name: 'Example', email: 'yassine@example.com',
      password: 'a-secure-password', acceptTerms: true, language: 'en',
    })).rejects.toMatchObject({
      statusCode: 409,
      message: 'An account with this email already exists',
    });
  });
});
