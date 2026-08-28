-- Indexes matched to the API's public browsing, hydration, ownership,
-- availability, favorites, and moderation query patterns.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS listings_public_created_idx
ON listings (created_at DESC)
WHERE status = 'approved' AND is_active = true;

CREATE INDEX IF NOT EXISTS listings_public_featured_idx
ON listings (created_at DESC)
WHERE status = 'approved' AND is_active = true AND is_featured = true;

CREATE INDEX IF NOT EXISTS listings_provider_created_idx
ON listings (provider_id, created_at DESC);

CREATE INDEX IF NOT EXISTS listings_public_category_created_idx
ON listings (category_id, created_at DESC)
WHERE status = 'approved' AND is_active = true;

CREATE INDEX IF NOT EXISTS listings_public_location_created_idx
ON listings (location_id, created_at DESC)
WHERE status = 'approved' AND is_active = true;

CREATE INDEX IF NOT EXISTS listings_public_price_idx
ON listings (base_price)
WHERE status = 'approved' AND is_active = true;

CREATE INDEX IF NOT EXISTS listings_public_capacity_idx
ON listings (guest_capacity)
WHERE status = 'approved' AND is_active = true;

CREATE INDEX IF NOT EXISTS listings_title_trgm_idx
ON listings USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS listings_description_trgm_idx
ON listings USING gin (description gin_trgm_ops);

CREATE INDEX IF NOT EXISTS users_name_trgm_idx
ON users USING gin (((COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))) gin_trgm_ops);

-- The primary key is ordered by listing_id first, so category-first lookups
-- need their own index.
CREATE INDEX IF NOT EXISTS listing_categories_category_listing_idx
ON listing_categories (category_id, listing_id);

CREATE INDEX IF NOT EXISTS listing_images_listing_sort_idx
ON listing_images (listing_id, sort_order, id);

CREATE INDEX IF NOT EXISTS bookings_listing_dates_active_idx
ON bookings (listing_id, start_date, end_date)
WHERE status NOT IN ('rejected', 'cancelled', 'refunded');

CREATE INDEX IF NOT EXISTS bookings_user_created_idx
ON bookings (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS reviews_booking_created_idx
ON reviews (booking_id, created_at DESC);

CREATE INDEX IF NOT EXISTS favorites_user_created_idx
ON favorites (user_id, created_at DESC) INCLUDE (listing_id);

CREATE INDEX IF NOT EXISTS announcement_request_images_request_sort_idx
ON announcement_request_images (request_id, sort_order, id);

CREATE INDEX IF NOT EXISTS audit_logs_actor_created_idx
ON audit_logs (actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_logs_entity_created_idx
ON audit_logs (entity_type, entity_id, created_at DESC);
