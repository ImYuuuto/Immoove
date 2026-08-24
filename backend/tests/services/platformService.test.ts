import { query } from '../../src/config/db';
import { ListingService } from '../../src/services/listingService';
import { PlatformService } from '../../src/services/platformService';

jest.mock('../../src/config/db', () => ({
  query: jest.fn(),
  transaction: jest.fn(),
}));

const mockedQuery = query as jest.MockedFunction<typeof query>;

describe('favorite listing responses', () => {
  afterEach(() => jest.restoreAllMocks());

  test('returns favorites through the camelCase listing mapper', async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [{ listing_id: 10 }] } as never);
    jest.spyOn(ListingService, 'findById').mockResolvedValueOnce({
      listingId: 10,
      providerId: 1,
      title: 'Favorite',
      basePrice: 50,
    } as never);

    const items = await PlatformService.getFavorites(7);

    expect(ListingService.findById).toHaveBeenCalledWith(10, {
      publicOnly: true,
    });
    expect(items[0]).toMatchObject({
      listingId: 10,
      providerId: 1,
      basePrice: 50,
    });
    expect(items[0]).not.toHaveProperty('listing_id');
  });
});
