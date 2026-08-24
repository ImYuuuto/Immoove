import { PoolClient } from 'pg';
import { transaction } from '../../src/config/db';
import { BookingService } from '../../src/services/bookingService';
import {
  createBookingSchema,
  updateBookingSchema,
} from '../../src/validators/listingValidators';

jest.mock('../../src/config/db', () => ({
  query: jest.fn(),
  transaction: jest.fn(),
}));

const mockedTransaction = transaction as jest.MockedFunction<
  typeof transaction
>;

function useClient(query: jest.Mock) {
  mockedTransaction.mockImplementation(async (callback) =>
    callback({ query } as unknown as PoolClient),
  );
}

describe('BookingService server-side pricing', () => {
  beforeEach(() => mockedTransaction.mockReset());

  test('strips client totals from create and update payloads', () => {
    const dates = {
      startDate: '2026-09-01T12:00:00.000Z',
      endDate: '2026-09-03T12:00:00.000Z',
    };
    expect(
      createBookingSchema.parse({ listingId: 4, total: 0.01, ...dates }),
    ).not.toHaveProperty('total');
    expect(
      updateBookingSchema.parse({ total: 0.01, ...dates }),
    ).not.toHaveProperty('total');
  });

  test('creates a booking using database price multiplied by billable days', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce({
        rows: [{ status: 'approved', is_active: true }],
      })
      .mockResolvedValueOnce({ rowCount: 0 })
      .mockResolvedValueOnce({
        rows: [
          {
            booking_id: 10,
            listing_id: 4,
            user_id: 7,
            start_date: '2026-09-01T12:00:00.000Z',
            end_date: '2026-09-03T12:00:00.000Z',
            total: '170.000',
            created_at: '2026-08-24T00:00:00.000Z',
          },
        ],
      });
    useClient(query);

    const result = await BookingService.create({
      listingId: 4,
      userId: 7,
      startDate: '2026-09-01T12:00:00.000Z',
      endDate: '2026-09-03T12:00:00.000Z',
      total: 0.01,
    } as never);

    expect(query.mock.calls[2][0]).toContain('SELECT base_price * $5');
    expect(query.mock.calls[2][1]).toEqual([
      4,
      7,
      '2026-09-01T12:00:00.000Z',
      '2026-09-03T12:00:00.000Z',
      2,
    ]);
    expect(result.total).toBe(170);
  });

  test('recalculates the total during admin updates', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce({
        rows: [
          {
            booking_id: 10,
            listing_id: 4,
            user_id: 7,
            start_date: '2026-09-01T12:00:00.000Z',
            end_date: '2026-09-02T12:00:00.000Z',
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [{ status: 'approved', is_active: true }],
      })
      .mockResolvedValueOnce({ rowCount: 0 })
      .mockResolvedValueOnce({
        rows: [
          {
            booking_id: 10,
            listing_id: 4,
            user_id: 7,
            start_date: '2026-09-01T12:00:00.000Z',
            end_date: '2026-09-03T13:00:00.000Z',
            total: '255.000',
            created_at: '2026-08-24T00:00:00.000Z',
          },
        ],
      });
    useClient(query);

    await BookingService.update(10, {
      endDate: new Date('2026-09-03T13:00:00.000Z'),
      total: 0.01,
    } as never);

    expect(query.mock.calls[3][0]).toContain('SELECT base_price * $5');
    expect(query.mock.calls[3][1][4]).toBe(3);
  });
});
