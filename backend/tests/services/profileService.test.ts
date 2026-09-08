import { DatabaseClient, query, transaction } from '../../src/config/db';
import { ProfileService } from '../../src/services/profileService';
import { AuthService } from '../../src/services/authService';

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
    jest.restoreAllMocks();
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
    mockedQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });
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

  test('requires password verification and normalizes email for contact changes', async () => {
    jest.spyOn(AuthService, 'verifyCurrentPassword').mockResolvedValue();
    mockedQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });
    mockedQuery.mockResolvedValueOnce({
      rows: [{
        user_id: 1, first_name: 'Yassine', last_name: 'Example',
        email: 'new@example.com', phone: '+212612345678', role: 'CLIENT', avatar_url: null,
      }],
    } as never);

    const result = await ProfileService.updateContact(1, {
      email: 'NEW@EXAMPLE.COM', phone: '+212612345678', currentPassword: 'CorrectPassword2026!',
    });

    expect(AuthService.verifyCurrentPassword).toHaveBeenCalledWith(1, 'CorrectPassword2026!');
    expect(mockedQuery.mock.calls[0][1]).toEqual(['new@example.com', 'new@example.com', 'new@example.com', '+212612345678', 1]);
    expect(result.email).toBe('new@example.com');
  });

  test('password-verifies and safely deactivates the user inside a transaction', async () => {
    jest.spyOn(AuthService, 'verifyCurrentPassword').mockResolvedValue();
    const client = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ user_id: 1, role: 'CLIENT' }] })
        .mockResolvedValueOnce({ rows: [{ blocked: false }] })
        .mockResolvedValueOnce({ rowCount: 1 }),
    };
    mockedTransaction.mockImplementation(async (callback) =>
      callback(client as unknown as DatabaseClient),
    );

    await ProfileService.deactivate(1, 'CorrectPassword2026!');

    expect(AuthService.verifyCurrentPassword).toHaveBeenCalledWith(
      1,
      'CorrectPassword2026!',
    );

    expect(client.query).toHaveBeenNthCalledWith(
      1,
      'SELECT user_id, role FROM users WHERE user_id = ? FOR UPDATE',
      [1],
    );
    expect(client.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('account_status = \'suspended\''),
      [1],
    );
  });

  test('does not deactivate an account with active booking obligations', async () => {
    jest.spyOn(AuthService, 'verifyCurrentPassword').mockResolvedValue();
    const client = {
      query: jest.fn()
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ user_id: 1, role: 'CLIENT' }] })
        .mockResolvedValueOnce({ rows: [{ blocked: true }] }),
    };
    mockedTransaction.mockImplementation(async (callback) => callback(client as unknown as DatabaseClient));

    await expect(ProfileService.deactivate(1, 'CorrectPassword2026!')).rejects.toMatchObject({ statusCode: 409 });
    expect(client.query).toHaveBeenCalledTimes(2);
  });
});
