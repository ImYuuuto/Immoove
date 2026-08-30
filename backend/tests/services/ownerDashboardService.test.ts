jest.mock('../../src/config/db', () => ({ query: jest.fn() }));

import { query } from '../../src/config/db';
import { OwnerDashboardService } from '../../src/services/ownerDashboardService';

const mockedQuery = query as jest.MockedFunction<typeof query>;

describe('OwnerDashboardService', () => {
  beforeEach(() => mockedQuery.mockReset());

  test('scopes statistics and properties to the authenticated owner', async () => {
    mockedQuery
      .mockResolvedValueOnce({ rows: [{ total_properties: 1, approved: 1, total_bookings: 2 }] } as never)
      .mockResolvedValueOnce({ rows: [{ listing_id: 7, title: 'Owner &amp; stay', status: 'approved', base_price: '600', bookings: 2, awaiting_bookings: 1, average_rating: '4.5', review_count: 2 }] } as never);

    const result = await OwnerDashboardService.get(42);

    expect(mockedQuery).toHaveBeenNthCalledWith(1, expect.stringContaining('l.provider_id = $1'), [42]);
    expect(mockedQuery).toHaveBeenNthCalledWith(2, expect.stringContaining('l.provider_id = $1'), [42]);
    expect(result.statistics.totalProperties).toBe(1);
    expect(result.properties[0]).toMatchObject({ listingId: 7, title: 'Owner & stay', averageRating: 4.5 });
  });
});
