import { DatabaseClient, query, transaction } from '../../src/config/db';
import { ReviewService } from '../../src/services/reviewService';

jest.mock('../../src/config/db', () => ({ query: jest.fn(), transaction: jest.fn() }));
const mockedQuery = query as jest.MockedFunction<typeof query>;
const mockedTransaction = transaction as jest.MockedFunction<typeof transaction>;

describe('review ownership boundaries', () => {
  beforeEach(() => { mockedQuery.mockReset(); mockedTransaction.mockReset(); });

  test('cannot create a review for another client booking', async () => {
    const client = { query: jest.fn().mockResolvedValueOnce({ rows: [{ user_id: 8, status: 'completed' }] }) };
    mockedTransaction.mockImplementationOnce(async callback => callback(client as unknown as DatabaseClient));
    await expect(ReviewService.create(7, { bookingId: 4, rating: 5, comment: 'Great' }))
      .rejects.toMatchObject({ statusCode: 403 });
    expect(client.query).toHaveBeenCalledTimes(1);
  });

  test('scopes client updates to reviews attached to their bookings', async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [] } as never);
    await expect(ReviewService.update(3, 7, 'CLIENT', { rating: 1 }))
      .rejects.toMatchObject({ statusCode: 404 });
    expect(mockedQuery.mock.calls[0][0]).toContain('(?=\'ADMIN\' OR b.user_id=?)');
    expect(mockedQuery.mock.calls[0][1]).toEqual([1, null, 3, 'CLIENT', 7]);
  });
});
