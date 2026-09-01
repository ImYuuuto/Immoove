import { PoolClient } from 'pg';
import { transaction } from '../../src/config/db';
import { ListingService } from '../../src/services/listingService';

jest.mock('../../src/config/db', () => ({
  query: jest.fn(),
  transaction: jest.fn(),
}));

const mockedTransaction = transaction as jest.MockedFunction<
  typeof transaction
>;

describe('profile listing ownership', () => {
  afterEach(() => jest.restoreAllMocks());

  test('allows a user to edit their own property and returns it to pending review', async () => {
    const current = { listingId: 10, providerId: 1 } as never;
    jest.spyOn(ListingService, 'findById').mockResolvedValueOnce(current).mockResolvedValueOnce(current);
    const client = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    mockedTransaction.mockImplementation(async (callback) => callback(client as unknown as PoolClient));

    await ListingService.update(10, 1, 'CLIENT', { title: 'Updated' });

    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining("status = 'pending'"),
      [10],
    );
  });

  test('does not reset status when an administrator edits a listing', async () => {
    const current = { listingId: 10, providerId: 1 } as never;
    jest
      .spyOn(ListingService, 'findById')
      .mockResolvedValueOnce(current)
      .mockResolvedValueOnce(current);
    const client = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    mockedTransaction.mockImplementation(async (callback) =>
      callback(client as unknown as PoolClient),
    );

    await ListingService.update(10, 2, 'ADMIN', { title: 'Staff edit' });

    expect(client.query.mock.calls[0][0]).not.toContain('status =');
    expect(client.query.mock.calls[0][0]).not.toContain('is_active =');
  });

  test('rejects a user attempting to edit another user property', async () => {
    const callsBefore = mockedTransaction.mock.calls.length;
    jest.spyOn(ListingService, 'findById').mockResolvedValueOnce({ listingId: 10, providerId: 2 } as never);
    await expect(ListingService.update(10, 1, 'CLIENT', { title: 'Bypass' })).rejects.toMatchObject({ statusCode: 403 });
    expect(mockedTransaction.mock.calls).toHaveLength(callsBefore);
  });
});
