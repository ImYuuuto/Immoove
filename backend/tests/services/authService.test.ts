import { PoolClient } from 'pg';
import { query, transaction } from '../../src/config/db';
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
  test('creates the account and immutable consent in one transaction using server time', async () => {
    const acceptedAt = new Date('2026-08-30T12:00:00.000Z');
    const client = {
      query: jest.fn()
        .mockResolvedValueOnce({ rows: [{ version: '1.0' }] })
        .mockResolvedValueOnce({ rows: [{
          user_id: 9, first_name: 'Yassine', last_name: 'Example',
          email: 'yassine@example.com', phone: null, role: 'CLIENT',
          session_version: 0, terms_accepted_at: acceptedAt, terms_version: '1.0',
        }] })
        .mockResolvedValueOnce({ rows: [] }),
    };
    mockedTransaction.mockImplementationOnce(async (callback) =>
      callback(client as unknown as PoolClient),
    );

    await AuthService.register({
      first_name: 'Yassine', last_name: 'Example', email: 'yassine@example.com',
      password: 'a-secure-password', acceptTerms: true, language: 'fr',
    });

    expect(client.query.mock.calls[1][0]).toContain('now()');
    expect(client.query.mock.calls[2][0]).toContain('user_legal_consents');
    expect(client.query.mock.calls[2][1]).toEqual([9, '1.0', acceptedAt, 'fr']);
  });
});
