import { query } from '../../config/db';
import { ListingWithRelations } from '../../types/db';
import { parseNumeric } from '../../utils/sqlHelpers';
import { decodeStoredText } from '../../utils/sanitize';

export function mapListing(row: any): ListingWithRelations {
  return {
    listingId: row.listing_id,
    providerId: row.provider_id,
    categoryId: row.category_id,
    locationId: row.location_id,
    title: decodeStoredText(row.title),
    description: row.description ? decodeStoredText(row.description) : row.description,
    basePrice: parseNumeric(row.base_price) || 0,
    pricingUnit: row.pricing_unit,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    contactEmail: row.contact_email,
    status: row.status,
    isActive: row.is_active,
    coverImageUrl: row.cover_image_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    serviceType: row.service_type,
    rentalTerm: row.rental_term,
    guestCapacity: row.guest_capacity,
    bedrooms: row.bedrooms,
    beds: row.beds,
    bathrooms: row.bathrooms,
    locationText: row.location_text ? decodeStoredText(row.location_text) : null,
    mapUrl: row.map_url,
    latitude: parseNumeric(row.latitude),
    longitude: parseNumeric(row.longitude),
    isFeatured: row.is_featured,
    images: [], features: [], amenities: [], bookings: [], availability: [], reviews: [],
    rating: { average: null, count: 0 },
  };
}

export async function hydrateListing(listing: ListingWithRelations): Promise<ListingWithRelations> {
  const [images, features, bookings, reviews, metadata] = await Promise.all([
    query<any>('SELECT id, listing_id, url, sort_order FROM listing_images WHERE listing_id = $1 ORDER BY sort_order, id', [listing.listingId]),
    query<any>('SELECT f.feature_id, f.name FROM features f JOIN listing_features lf ON lf.feature_id = f.feature_id WHERE lf.listing_id = $1 ORDER BY f.name', [listing.listingId]),
    query<any>(`SELECT booking_id, start_date, end_date, 'booking' AS source
      FROM bookings WHERE listing_id = $1 AND status NOT IN ('cancelled','rejected','refunded')
      UNION ALL
      SELECT NULL::integer AS booking_id, start_date, end_date, 'admin_block' AS source
      FROM listing_availability_blocks WHERE listing_id = $1 ORDER BY start_date`, [listing.listingId]),
    query<any>('SELECT r.review_id, r.rating, r.comment, r.created_at, u.user_id, u.first_name, u.last_name FROM reviews r JOIN bookings b ON b.booking_id = r.booking_id LEFT JOIN users u ON u.user_id = b.user_id WHERE b.listing_id = $1 ORDER BY r.created_at DESC', [listing.listingId]),
    query<any>(`SELECT c.category_id, c.name, c.slug, l.location_id, l.name AS location_name,
      COALESCE(x.latitude,l.lat) AS lat, COALESCE(x.longitude,l.lng) AS lng,
      u.user_id, u.first_name AS provider_first_name, u.last_name AS provider_last_name,
      po.owner_id, po.first_name AS owner_first_name, po.last_name AS owner_last_name, po.photo_url AS owner_photo_url,
      pt.property_type_id, pt.name AS property_type_name, pt.slug AS property_type_slug,
      a.area_id, a.name AS area_name, ci.city_id, ci.name AS city_name, r.region_id, r.name AS region_name
      FROM listings x
      LEFT JOIN categories c ON c.category_id = x.category_id LEFT JOIN locations l ON l.location_id = x.location_id
      LEFT JOIN users u ON u.user_id = x.provider_id LEFT JOIN property_owners po ON po.owner_id = x.owner_id
      LEFT JOIN property_types pt ON pt.property_type_id = x.property_type_id LEFT JOIN areas a ON a.area_id = x.area_id
      LEFT JOIN cities ci ON ci.city_id = a.city_id LEFT JOIN regions r ON r.region_id = ci.region_id
      WHERE x.listing_id = $1`, [listing.listingId]),
  ]);
  const meta = metadata.rows[0];
  const amenities = features.rows.map((row) => ({ featureId: row.feature_id, name: decodeStoredText(row.name) }));
  const mappedReviews = reviews.rows.map((row) => ({
    reviewId: row.review_id, rating: row.rating,
    comment: row.comment ? decodeStoredText(row.comment) : row.comment,
    createdAt: row.created_at,
    user: row.user_id ? { userId: row.user_id, firstName: decodeStoredText(row.first_name || ''), lastName: decodeStoredText(row.last_name || '') } : null,
  }));
  const ratingTotal = mappedReviews.reduce((total, review) => total + review.rating, 0);
  return {
    ...listing,
    images: images.rows.map((row) => ({ id: row.id, listingId: row.listing_id, url: row.url, sortOrder: row.sort_order })),
    features: amenities,
    amenities,
    bookings: bookings.rows.filter((row) => row.booking_id).map((row) => ({ bookingId: row.booking_id, startDate: row.start_date, endDate: row.end_date })),
    availability: bookings.rows.map((row) => ({ startDate: row.start_date, endDate: row.end_date })),
    reviews: mappedReviews,
    rating: { average: mappedReviews.length ? ratingTotal / mappedReviews.length : null, count: mappedReviews.length },
    category: meta?.category_id ? { categoryId: meta.category_id, name: meta.name, slug: meta.slug } : undefined,
    location: meta?.location_id ? { locationId: meta.location_id, name: meta.location_name, lat: parseNumeric(meta.lat) || 0, lng: parseNumeric(meta.lng) || 0 } : undefined,
    propertyType: meta?.property_type_id ? { propertyTypeId: meta.property_type_id, name: meta.property_type_name, slug: meta.property_type_slug } : undefined,
    area: meta?.area_id ? { areaId: meta.area_id, name: meta.area_name, cityId: meta.city_id } : undefined,
    city: meta?.city_id ? { cityId: meta.city_id, name: meta.city_name, regionId: meta.region_id } : undefined,
    region: meta?.region_id ? { regionId: meta.region_id, name: meta.region_name } : undefined,
    provider: meta?.user_id ? { userId: meta.user_id, firstName: decodeStoredText(meta.provider_first_name || ''), lastName: decodeStoredText(meta.provider_last_name || '') } : undefined,
    owner: meta?.owner_id
      ? { ownerId: meta.owner_id, firstName: decodeStoredText(meta.owner_first_name || ''), lastName: decodeStoredText(meta.owner_last_name || ''), photoUrl: meta.owner_photo_url }
      : meta?.user_id ? { userId: meta.user_id, firstName: decodeStoredText(meta.provider_first_name || ''), lastName: decodeStoredText(meta.provider_last_name || '') } : undefined,
  };
}
