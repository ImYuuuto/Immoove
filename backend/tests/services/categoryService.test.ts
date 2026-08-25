import { query } from '../../src/config/db';
import { CategoryService } from '../../src/services/categoryService';

jest.mock('../../src/config/db', () => ({ query: jest.fn() }));

const mockedQuery = query as jest.MockedFunction<typeof query>;

describe('CategoryService', () => {
  beforeEach(() => mockedQuery.mockReset());

  test('returns the four navigation categories in camelCase', async () => {
    mockedQuery.mockResolvedValueOnce({
      rows: [
        {
          category_id: 1,
          name: 'Housing',
          slug: 'housing',
          listing_count: '3',
        },
      ],
    } as never);

    await expect(CategoryService.list()).resolves.toEqual([
      {
        categoryId: 1,
        name: 'Housing',
        slug: 'housing',
        listingCount: 3,
      },
    ]);
  });

  test('returns approved category cards with rating and pagination', async () => {
    mockedQuery
      .mockResolvedValueOnce({
        rows: [{ category_id: 4, name: 'Renting Cars', slug: 'renting-cars' }],
      } as never)
      .mockResolvedValueOnce({ rows: [{ count: '1' }] } as never)
      .mockResolvedValueOnce({
        rows: [
          {
            listing_id: 22,
            provider_id: 7,
            title: 'City Car',
            description: 'Automatic',
            base_price: '90',
            pricing_unit: 'day',
            guest_capacity: 5,
            cover_image_url: null,
            service_type: 'CAR_RENTAL',
            average_rating: '4.5',
            review_count: 2,
            created_at: '2026-08-25T12:00:00.000Z',
          },
        ],
      } as never);

    const result = await CategoryService.listings('renting-cars', 1, 20);

    expect(result.category.slug).toBe('renting-cars');
    expect(result.items[0]).toMatchObject({
      listingId: 22,
      title: 'City Car',
      basePrice: 90,
      pricingUnit: 'day',
      rating: { average: 4.5, count: 2 },
    });
    expect(result.pagination).toEqual({
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    expect(mockedQuery.mock.calls[2][1]).toEqual([4, 20, 0]);
  });
});
