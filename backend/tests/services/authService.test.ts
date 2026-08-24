import { query } from '../../src/config/db';
import { AuthService } from '../../src/services/authService';

jest.mock('../../src/config/db', () => ({ query: jest.fn() }));

const mockedQuery = query as jest.MockedFunction<typeof query>;
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
