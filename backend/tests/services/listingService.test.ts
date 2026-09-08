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
    expect(mockedQuery.mock.calls[0][1]).toEqual([1, '%Stay%', '%Stay%']);
    expect(mockedQuery.mock.calls[1][1]).toEqual([1, '%Stay%', '%Stay%', 5, 5]);
  });

  it('returns only current-user listings in camelCase without status filtering', async () => {
    mockedQuery.mockResolvedValueOnce({
      rows: [
        {
          listing_id: 10,
          provider_id: 1,
          title: 'Mine &amp; yours',
          description: 'Description',
          base_price: '500',
          guest_capacity: 4,
          cover_image_url: null,
          service_type: 'VACATION_RENTAL',
          status: 'rejected',
          created_at: '2026-08-24T12:00:00.000Z',
        },
      ],
    } as never);

    const items = await ListingService.findMine(1);

    expect(mockedQuery).toHaveBeenCalledWith(
      expect.stringContaining('provider_id = ?'),
      [1],
    );
    expect(items[0]).toEqual({
      listingId: 10,
      providerId: 1,
      title: 'Mine & yours',
      description: 'Description',
      basePrice: 500,
      guestCapacity: 4,
      coverImageUrl: null,
      serviceType: 'VACATION_RENTAL',
      status: 'rejected',
      createdAt: '2026-08-24T12:00:00.000Z',
    });
  });

  it('applies property discovery filters at the database boundary', async () => {
    mockedQuery
      .mockResolvedValueOnce({ rows: [{ count: '0' }] } as never)
      .mockResolvedValueOnce({ rows: [] } as never);

    await ListingService.search({
      page: 1,
      limit: 18,
      regionId: 2,
      cityId: 3,
      areaId: 4,
      propertyType: 'riad',
      bedrooms: 2,
      bathrooms: 1,
      amenityIds: [5, 7],
      minRating: 4,
      instantAvailable: true,
    });

    const [sql, params] = mockedQuery.mock.calls[0];
    expect(sql).toEqual(expect.stringContaining('housing.slug = \'housing\''));
    expect(sql).toEqual(expect.stringContaining('pt.slug'));
    expect(sql).toEqual(expect.stringContaining('listing_features'));
    expect(sql).toEqual(expect.stringContaining('AVG(rv.rating)'));
    expect(sql).toEqual(expect.stringContaining('active_booking.end_date > now()'));
    expect(params).toEqual([2, 3, 4, 'riad', 2, 1, 5, 7, 4]);
  });

  it('uses string literals when loading property discovery regions', async () => {
    mockedQuery.mockResolvedValue({ rows: [] } as never);

    await ListingService.propertyDiscoveryOptions();

    expect(mockedQuery.mock.calls[1][0]).toContain('name <> \'Unassigned\'');
    expect(mockedQuery.mock.calls[1][0]).not.toContain('name <> "Unassigned"');
  });

  it('hydrates public detail with amenities, reviews, rating, and private availability', async () => {
    mockedQuery
      .mockResolvedValueOnce({
        rows: [
          {
            listing_id: 10,
            provider_id: 1,
            category_id: 2,
            title: 'Service',
            description: 'Description',
            base_price: '25',
            pricing_unit: 'hour',
            status: 'approved',
            is_active: true,
          },
        ],
      } as never)
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            listing_id: 10,
            url: 'https://example.com/1.jpg',
            sort_order: 0,
          },
        ],
      } as never)
      .mockResolvedValueOnce({
        rows: [{ feature_id: 3, name: 'Wi-Fi' }],
      } as never)
      .mockResolvedValueOnce({
        rows: [
          { booking_id: 8, start_date: '2026-09-01', end_date: '2026-09-02' },
        ],
      } as never)
      .mockResolvedValueOnce({
        rows: [
          {
            review_id: 4,
            rating: 5,
            comment: 'Great &amp; clean',
            created_at: '2026-08-20',
            user_id: 2,
            first_name: 'Previous',
            last_name: 'Guest',
          },
        ],
      } as never)
      .mockResolvedValueOnce({
        rows: [
          {
            category_id: 2,
            name: 'Activities',
            slug: 'activities',
            user_id: 1,
            provider_first_name: 'Admin',
            provider_last_name: 'Account',
            owner_id: 9,
            owner_first_name: 'Owner',
            owner_last_name: 'Name',
            owner_photo_url: '/uploads/owners/owner.webp',
          },
        ],
      } as never);

    const item = await ListingService.findById(10);

    expect(item?.amenities).toEqual([{ featureId: 3, name: 'Wi-Fi' }]);
    expect(item?.availability).toEqual([
      { startDate: '2026-09-01', endDate: '2026-09-02' },
    ]);
    expect(item?.bookings[0]).not.toHaveProperty('userId');
    expect(item?.reviews[0].comment).toBe('Great & clean');
    expect(item?.rating).toEqual({ average: 5, count: 1 });
    expect(item?.owner).toEqual({
      ownerId: 9,
      firstName: 'Owner',
      lastName: 'Name',
      photoUrl: '/uploads/owners/owner.webp',
    });
  });
});
