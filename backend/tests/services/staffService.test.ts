import { query } from '../../src/config/db';
import { AdminDashboardService } from '../../src/services/staffService';

jest.mock('../../src/config/db', () => ({ query: jest.fn(), transaction: jest.fn() }));
const mockedQuery = query as jest.MockedFunction<typeof query>;

describe('AdminDashboardService', () => {
  beforeEach(() => mockedQuery.mockReset());

  test('maps server aggregates into dashboard KPIs and trends', async () => {
    mockedQuery
      .mockResolvedValueOnce({ rows: [{ total_users: '12', new_users: '3', active_listings: '5', pending_listings: '2', pending_requests: '1', bookings: '4', gross_booking_value: '850.50', cancelled_bookings: '1' }] } as never)
      .mockResolvedValueOnce({ rows: [{ day: '2026-08-25', bookings: '4', gross_booking_value: '850.50' }] } as never)
      .mockResolvedValueOnce({ rows: [{ slug: 'housing', name: 'Housing', listings: '5', bookings: '4', gross_booking_value: '850.50' }] } as never)
      .mockResolvedValueOnce({ rows: [{ open: '3', overdue: '1', oldest_hours: '9.5' }] } as never);

    const result = await AdminDashboardService.overview(30);

    expect(result.kpis).toMatchObject({ totalUsers: 12, grossBookingValue: 850.5, cancellationRate: 0.25 });
    expect(result.trend[0]).toMatchObject({ bookings: 4, grossBookingValue: 850.5 });
    expect(result.moderation).toEqual({ open: 3, overdue: 1, oldestHours: 9.5 });
  });
});
