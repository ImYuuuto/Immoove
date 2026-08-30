import { PoolClient } from 'pg';
import { transaction } from '../../src/config/db';
import {
  billableUnits,
  BookingService,
} from '../../src/services/bookingService';
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
      createBookingSchema.parse({
        listingId: 4,
        total: 0.01,
        firstName: 'Yassine',
        lastName: 'Example',
        email: 'yassine@example.com',
        phone: '+216 12 345 678',
        ...dates,
      }),
    ).not.toHaveProperty('total');
    expect(
      updateBookingSchema.parse({ total: 0.01, ...dates }),
    ).not.toHaveProperty('total');
  });

  test('calculates night, hour, and fixed-service billing units', () => {
    const start = '2026-09-01T12:00:00.000Z';
    const end = '2026-09-01T14:30:00.000Z';

    expect(billableUnits(start, end, 'night')).toBe(1);
    expect(billableUnits(start, end, 'hour')).toBe(3);
    expect(billableUnits(start, end, 'service')).toBe(1);
    expect(billableUnits(start, end, null, 'ACTIVITY')).toBe(1);
  });

  test('creates a booking using database price multiplied by billable days', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce({
        rows: [
          {
            status: 'approved',
            is_active: true,
            pricing_unit: 'night',
            service_type: 'VACATION_RENTAL',
          },
        ],
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
      firstName: 'Yassine',
      lastName: 'Example',
      email: 'YASSINE@example.com',
      phone: '+216 12 345 678',
      total: 0.01,
    } as never);

    expect(query.mock.calls[2][0]).toContain('SELECT base_price * $5');
    expect(query.mock.calls[2][1]).toEqual([
      4,
      7,
      '2026-09-01T12:00:00.000Z',
      '2026-09-03T12:00:00.000Z',
      2,
      'Yassine',
      'Example',
      'yassine@example.com',
      '+216 12 345 678',
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
        rows: [
          {
            status: 'approved',
            is_active: true,
            pricing_unit: 'night',
            service_type: 'VACATION_RENTAL',
          },
        ],
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

    await BookingService.update(10, 1, 'ADMIN', {
      endDate: new Date('2026-09-03T13:00:00.000Z'),
      total: 0.01,
    } as never);

    expect(query.mock.calls[3][0]).toContain('SELECT base_price * $5');
    expect(query.mock.calls[3][1][4]).toBe(3);
  });

  test('rejects a client attempting to cancel another client booking', async () => {
    const query = jest.fn().mockResolvedValueOnce({
      rows: [{ booking_id: 10, user_id: 8 }],
    });
    useClient(query);

    await expect(
      BookingService.update(10, 7, 'CLIENT', { status: 'cancelled' }),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(query).toHaveBeenCalledTimes(1);
  });
});
