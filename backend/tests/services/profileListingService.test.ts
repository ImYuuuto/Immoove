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

  test('rejects owner property edits because the dashboard is read-only', async () => {
    const current = { listingId: 10, providerId: 1 } as never;
    jest.spyOn(ListingService, 'findById').mockResolvedValueOnce(current);
    await expect(
      ListingService.update(10, 1, 'OWNER', { title: 'Updated' }),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(mockedTransaction).not.toHaveBeenCalled();
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

  test('rejects a client even when a legacy listing references that client', async () => {
    const callsBefore = mockedTransaction.mock.calls.length;
    jest.spyOn(ListingService, 'findById').mockResolvedValueOnce({ listingId: 10, providerId: 1 } as never);
    await expect(ListingService.update(10, 1, 'CLIENT', { title: 'Bypass' })).rejects.toMatchObject({ statusCode: 403 });
    expect(mockedTransaction.mock.calls).toHaveLength(callsBefore);
  });
});
