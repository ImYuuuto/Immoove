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

  test('resets owner-edited listings to pending and inactive', async () => {
    const current = { listingId: 10, providerId: 1 } as never;
    const updated = {
      listingId: 10,
      providerId: 1,
      status: 'pending',
    } as never;
    jest
      .spyOn(ListingService, 'findById')
      .mockResolvedValueOnce(current)
      .mockResolvedValueOnce(updated);
    const client = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    mockedTransaction.mockImplementation(async (callback) =>
      callback(client as unknown as PoolClient),
    );

    await ListingService.update(10, 1, 'OWNER', { title: 'Updated' });

    const [sql, values] = client.query.mock.calls[0];
    expect(sql).toContain('status = $3');
    expect(sql).toContain('is_active = $4');
    expect(values).toEqual([10, 'Updated', 'pending', false]);
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
});
