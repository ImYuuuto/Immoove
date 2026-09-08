import { query } from '../../config/db';
import { ListingWithRelations } from '../../types/db';
import { ListingSearchParams } from '../../types/dto';
import { decodeStoredText } from '../../utils/sanitize';

type ListingLoader = (listingId: number) => Promise<ListingWithRelations | null>;

export async function searchListings(filters: ListingSearchParams, loadListing: ListingLoader) {
  const clauses = [
    'l.status = \'approved\'',
    'l.is_active = true',
    'l.archived_at IS NULL',
    `(l.service_type = 'VACATION_RENTAL' OR EXISTS (
      SELECT 1 FROM categories housing
      WHERE housing.category_id = l.category_id AND housing.slug = 'housing'
    ))`,
  ];
  const params: unknown[] = [];
  const add = (sql: string, value: unknown) => {
    params.push(value);
    clauses.push(sql);
  };
  if (filters.checkIn && filters.checkOut) {
    params.push(filters.checkOut, filters.checkIn);
    clauses.push('NOT EXISTS (SELECT 1 FROM bookings b WHERE b.listing_id = l.listing_id AND b.status NOT IN (\'cancelled\', \'rejected\', \'refunded\') AND b.start_date < ? AND b.end_date > ?)');
  }
  if (filters.guests) add('l.guest_capacity >= ?', filters.guests);
  if (filters.minPrice !== undefined) add('l.base_price >= ?', filters.minPrice);
  if (filters.maxPrice !== undefined) add('l.base_price <= ?', filters.maxPrice);
  if (filters.rentalTerm) {
    params.push(filters.rentalTerm);
    clauses.push('(l.rental_term = ? OR l.rental_term = \'both\')');
  }
  if (filters.regionId) add('EXISTS (SELECT 1 FROM areas a JOIN cities ci ON ci.city_id = a.city_id WHERE a.area_id = l.area_id AND ci.region_id = ?)', filters.regionId);
  if (filters.cityId) add('EXISTS (SELECT 1 FROM areas a WHERE a.area_id = l.area_id AND a.city_id = ?)', filters.cityId);
  if (filters.areaId) add('l.area_id = ?', filters.areaId);
  if (filters.propertyType) add('EXISTS (SELECT 1 FROM property_types pt WHERE pt.property_type_id = l.property_type_id AND pt.slug = ? AND pt.is_active = true)', filters.propertyType);
  if (filters.bedrooms !== undefined) add('l.bedrooms >= ?', filters.bedrooms);
  if (filters.bathrooms !== undefined) add('l.bathrooms >= ?', filters.bathrooms);
  for (const amenityId of filters.amenityIds || [])
    add('EXISTS (SELECT 1 FROM listing_features lf WHERE lf.listing_id = l.listing_id AND lf.feature_id = ?)', amenityId);
  if (filters.minRating !== undefined)
    add(`COALESCE((SELECT AVG(rv.rating) FROM reviews rv
      JOIN bookings rb ON rb.booking_id = rv.booking_id
      WHERE rb.listing_id = l.listing_id), 0) >= ?`, filters.minRating);
  if (filters.instantAvailable && !(filters.checkIn && filters.checkOut))
    clauses.push(`NOT EXISTS (
      SELECT 1 FROM bookings active_booking
      WHERE active_booking.listing_id = l.listing_id
        AND active_booking.status NOT IN ('cancelled', 'rejected', 'refunded')
        AND active_booking.end_date > now()
    )`);

  const where = `WHERE ${clauses.join(' AND ')}`;
  const count = await query<{ count: string }>(`SELECT COUNT(*) AS count FROM listings l ${where}`, params);
  const offset = (filters.page - 1) * filters.limit;
  const rows = await query<{ listing_id: number }>(
    `SELECT l.listing_id FROM listings l ${where} ORDER BY l.is_featured DESC, l.created_at DESC LIMIT ? OFFSET ?`,
    [...params, filters.limit, offset],
  );
  const items = await Promise.all(rows.rows.map((row) => loadListing(row.listing_id)));
  const total = Number(count.rows[0]?.count || 0);
  return {
    items: items.filter((item): item is ListingWithRelations => item !== null),
    pagination: { total, page: filters.page, limit: filters.limit, totalPages: Math.ceil(total / filters.limit) },
  };
}

export async function getPropertyDiscoveryOptions() {
  const [propertyTypes, regions, cities, areas, amenities, prices] = await Promise.all([
    query<any>('SELECT property_type_id, name, slug FROM property_types WHERE is_active = true ORDER BY name'),
    query<any>('SELECT region_id, name FROM regions WHERE name <> \'Unassigned\' AND is_active=true ORDER BY name'),
    query<any>(`SELECT ci.city_id, ci.region_id, ci.name FROM cities ci JOIN regions r ON r.region_id = ci.region_id
      WHERE ci.name <> 'Unassigned' AND r.name <> 'Unassigned' AND ci.is_active=true AND r.is_active=true ORDER BY ci.name`),
    query<any>(`SELECT a.area_id, a.city_id, a.name FROM areas a JOIN cities ci ON ci.city_id = a.city_id
      JOIN regions r ON r.region_id = ci.region_id
      WHERE a.requires_review = false AND a.is_active=true AND ci.is_active=true AND r.is_active=true
        AND ci.name <> 'Unassigned' AND r.name <> 'Unassigned' ORDER BY a.name`),
    query<any>('SELECT feature_id, name FROM features ORDER BY name'),
    query<any>(`SELECT COALESCE(MIN(base_price), 0) AS minimum, COALESCE(MAX(base_price), 0) AS maximum
      FROM listings WHERE status='approved' AND is_active=true AND archived_at IS NULL`),
  ]);
  return {
    propertyTypes: propertyTypes.rows.map((row) => ({ propertyTypeId: row.property_type_id, name: decodeStoredText(row.name), slug: row.slug })),
    regions: regions.rows.map((row) => ({ regionId: row.region_id, name: decodeStoredText(row.name) })),
    cities: cities.rows.map((row) => ({ cityId: row.city_id, regionId: row.region_id, name: decodeStoredText(row.name) })),
    areas: areas.rows.map((row) => ({ areaId: row.area_id, cityId: row.city_id, name: decodeStoredText(row.name) })),
    amenities: amenities.rows.map((row) => ({ featureId: row.feature_id, name: decodeStoredText(row.name) })),
    priceRange: { minimum: Number(prices.rows[0]?.minimum || 0), maximum: Number(prices.rows[0]?.maximum || 0) },
  };
}
