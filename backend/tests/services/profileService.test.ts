import { PoolClient } from 'pg';
import { query, transaction } from '../../src/config/db';
import { ProfileService } from '../../src/services/profileService';

jest.mock('../../src/config/db', () => ({
  query: jest.fn(),
  transaction: jest.fn(),
}));

const mockedQuery = query as jest.MockedFunction<typeof query>;
const mockedTransaction = transaction as jest.MockedFunction<
  typeof transaction
>;

describe('ProfileService', () => {
  beforeEach(() => {
    mockedQuery.mockReset();
    mockedTransaction.mockReset();
  });

  test('returns the authenticated profile with plain text and nullable avatar', async () => {
    mockedQuery.mockResolvedValueOnce({
      rows: [
        {
          user_id: 1,
          first_name: 'Yassine &amp; Co',
          last_name: 'Example',
          email: 'yassine@example.com',
          phone: null,
          role: 'user',
          avatar_url: null,
        },
      ],
    } as never);

    await expect(ProfileService.get(1)).resolves.toEqual({
      userId: 1,
      firstName: 'Yassine & Co',
      lastName: 'Example',
      email: 'yassine@example.com',
      phone: null,
      role: 'user',
      avatarUrl: null,
    });
  });

  test('sanitizes names before updating and returns ordinary text', async () => {
    mockedQuery.mockResolvedValueOnce({
      rows: [
        {
          user_id: 1,
          first_name: 'New &amp; safe',
          last_name: 'Name',
          email: 'yassine@example.com',
          phone: '+216 12 345 678',
          role: 'user',
          avatar_url: null,
        },
      ],
    } as never);

    const user = await ProfileService.update(
      1,
      '<b>New & safe</b>',
      '<i>Name</i>',
    );

    expect(mockedQuery.mock.calls[0][1]).toEqual(['New &amp; safe', 'Name', 1]);
    expect(user.firstName).toBe('New & safe');
  });

  test('deletes the user inside a transaction', async () => {
    const client = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rowCount: 1 })
        .mockResolvedValueOnce({ rowCount: 1 }),
    };
    mockedTransaction.mockImplementation(async (callback) =>
      callback(client as unknown as PoolClient),
    );

    await ProfileService.delete(1);

    expect(client.query).toHaveBeenNthCalledWith(
      1,
      'SELECT user_id FROM users WHERE user_id = $1 FOR UPDATE',
      [1],
    );
    expect(client.query).toHaveBeenNthCalledWith(
      2,
      'DELETE FROM users WHERE user_id = $1',
      [1],
    );
  });
});
