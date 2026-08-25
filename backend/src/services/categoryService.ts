import { query } from '../config/db';
import { AppError } from '../utils/errorHandler';
import { decodeStoredText } from '../utils/sanitize';
import { parseNumeric } from '../utils/sqlHelpers';

const categorySlugs = [
  'housing',
  'services',
  'hobbies-and-activities',
  'renting-cars',
];

export class CategoryService {
  static async list() {
    const result = await query<{
      category_id: number;
      name: string;
      slug: string;
      listing_count: string;
    }>(
      `SELECT c.category_id, c.name, c.slug, COUNT(DISTINCT l.listing_id)::text AS listing_count
       FROM categories c
       LEFT JOIN listings l ON (
         l.category_id = c.category_id OR EXISTS (
           SELECT 1 FROM listing_categories lc
           WHERE lc.listing_id = l.listing_id AND lc.category_id = c.category_id
         )
       ) AND l.status = 'approved' AND l.is_active = true
       WHERE c.slug = ANY($1::text[])
       GROUP BY c.category_id, c.name, c.slug
       ORDER BY array_position($1::text[], c.slug)`,
      [categorySlugs],
    );
    return result.rows.map((row) => ({
      categoryId: row.category_id,
      name: row.name,
      slug: row.slug,
      listingCount: Number(row.listing_count),
    }));
  }

  static async listings(slug: string, page: number, limit: number) {
    const categoryResult = await query<{
      category_id: number;
      name: string;
      slug: string;
    }>('SELECT category_id, name, slug FROM categories WHERE slug = $1', [
      slug,
    ]);
    const category = categoryResult.rows[0];
    if (!category) throw new AppError(404, 'Category not found');

    const membership = `l.status = 'approved' AND l.is_active = true AND (
      l.category_id = $1 OR EXISTS (
        SELECT 1 FROM listing_categories lc
        WHERE lc.listing_id = l.listing_id AND lc.category_id = $1
      )
    )`;
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM listings l WHERE ${membership}`,
      [category.category_id],
    );
    const offset = (page - 1) * limit;
    const listingsResult = await query<any>(
      `SELECT l.listing_id, l.provider_id, l.title, l.description, l.base_price,
              l.pricing_unit, l.guest_capacity, l.cover_image_url, l.service_type,
              l.created_at, COALESCE(AVG(r.rating), 0) AS average_rating,
              COUNT(r.review_id)::int AS review_count
       FROM listings l
       LEFT JOIN bookings b ON b.listing_id = l.listing_id
       LEFT JOIN reviews r ON r.booking_id = b.booking_id
       WHERE ${membership}
       GROUP BY l.listing_id
       ORDER BY l.created_at DESC
       LIMIT $2 OFFSET $3`,
      [category.category_id, limit, offset],
    );
    const total = Number(countResult.rows[0]?.count || 0);
    return {
      category: {
        categoryId: category.category_id,
        name: category.name,
        slug: category.slug,
      },
      items: listingsResult.rows.map((row) => ({
        listingId: row.listing_id,
        providerId: row.provider_id,
        title: decodeStoredText(row.title),
        description: row.description
          ? decodeStoredText(row.description)
          : row.description,
        basePrice: parseNumeric(row.base_price) || 0,
        pricingUnit: row.pricing_unit,
        guestCapacity: row.guest_capacity,
        coverImageUrl: row.cover_image_url,
        serviceType: row.service_type,
        rating: {
          average: Number(row.review_count) ? Number(row.average_rating) : null,
          count: Number(row.review_count),
        },
        createdAt: row.created_at,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
