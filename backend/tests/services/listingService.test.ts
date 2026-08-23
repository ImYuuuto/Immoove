jest.mock('../../src/config/db', () => ({
  query: jest.fn(),
  transaction: jest.fn(),
}));
import { query } from '../../src/config/db';
import { ListingService } from '../../src/services/listingService';
const mockedQuery = query as jest.MockedFunction<typeof query>;
const emptyRelations = () => ({ rows: [] }) as any;
describe('ListingService', () => {
  beforeEach(() => mockedQuery.mockReset());
  it('filters and paginates listings while mapping numeric values', async () => {
    mockedQuery
      .mockResolvedValueOnce({ rows: [{ count: '1' }] } as any)
      .mockResolvedValueOnce({
        rows: [
          {
            listing_id: 4,
            provider_id: 2,
            category_id: 1,
            title: 'Stay',
            base_price: '42.50',
            status: 'approved',
            is_active: true,
          },
        ],
      } as any)
      .mockResolvedValue(emptyRelations() as any);
    const result = await ListingService.findAll({
      page: 2,
      limit: 5,
      categoryId: 1,
      search: 'Stay',
    });
    expect(result.pagination).toEqual({
      total: 1,
      page: 2,
      limit: 5,
      totalPages: 1,
    });
    expect(result.items[0].basePrice).toBe(42.5);
    expect(mockedQuery.mock.calls[0][1]).toEqual([1, '%Stay%']);
    expect(mockedQuery.mock.calls[1][1]).toEqual([1, '%Stay%', 5, 5]);
  });
});
