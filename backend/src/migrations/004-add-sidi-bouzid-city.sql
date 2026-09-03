-- Promote Sidi Bouzid from an El Jadida area to its own searchable city.
INSERT INTO cities (region_id, name, is_active)
SELECT region_id, 'Sidi Bouzid', true
FROM regions
WHERE name = 'Casablanca-Settat'
ON CONFLICT (region_id, name) DO UPDATE SET is_active = true;

UPDATE areas
SET city_id = (SELECT city_id FROM cities WHERE name = 'Sidi Bouzid' ORDER BY city_id LIMIT 1),
    is_active = true,
    requires_review = false
WHERE lower(name) = 'sidi bouzid';

INSERT INTO areas (city_id, name, requires_review, is_active, lat, lng)
SELECT city_id, 'Sidi Bouzid', false, true, 33.2314, -8.5562
FROM cities c
WHERE c.name = 'Sidi Bouzid'
  AND NOT EXISTS (SELECT 1 FROM areas a WHERE a.city_id = c.city_id AND lower(a.name) = 'sidi bouzid');

WITH destination AS (
  SELECT c.city_id, a.area_id
  FROM cities c
  JOIN areas a ON a.city_id = c.city_id AND lower(a.name) = 'sidi bouzid'
  WHERE c.name = 'Sidi Bouzid' AND c.is_active = true
  ORDER BY a.area_id LIMIT 1
), samples(series, title, type_slug, price, capacity, bedrooms, bathrooms, image_url) AS (
  VALUES
    (1, 'Atlantic Beach Apartment · Sidi Bouzid', 'apartment', 520, 4, 2, 1, '/uploads/site/listings/maison-bleue.jpg'),
    (2, 'Coastal Light Studio · Sidi Bouzid', 'studio', 330, 2, 1, 1, '/uploads/site/listings/dar-el-bahri.jpg'),
    (3, 'Ocean Garden Villa · Sidi Bouzid', 'villa', 1380, 8, 4, 3, '/uploads/site/listings/villa-des-dunes.jpg'),
    (4, 'Sunset Terrace Apartment · Sidi Bouzid', 'apartment', 610, 5, 3, 2, '/uploads/site/listings/maison-bleue.jpg'),
    (5, 'Surfside Design Studio · Sidi Bouzid', 'studio', 370, 2, 1, 1, '/uploads/site/listings/dar-el-bahri.jpg'),
    (6, 'Family Pool Villa · Sidi Bouzid', 'villa', 1560, 10, 5, 4, '/uploads/site/listings/villa-des-dunes.jpg'),
    (7, 'Blue Balcony Apartment · Sidi Bouzid', 'apartment', 570, 4, 2, 2, '/uploads/site/listings/maison-bleue.jpg'),
    (8, 'Panoramic Dunes Villa · Sidi Bouzid', 'villa', 1810, 9, 4, 3, '/uploads/site/listings/villa-des-dunes.jpg')
), admin_user AS (
  SELECT user_id, first_name, last_name, email, phone
  FROM users WHERE role = 'ADMIN' AND account_status = 'active'
  ORDER BY user_id LIMIT 1
)
INSERT INTO listings (
  provider_id, category_id, area_id, property_type_id, title, description,
  base_price, pricing_unit, contact_name, contact_phone, contact_email,
  status, is_active, cover_image_url, service_type, guest_capacity,
  bedrooms, beds, bathrooms, rental_term, submitted_at, reviewed_at, reviewed_by, created_at
)
SELECT admin_user.user_id, category.category_id, destination.area_id, property_type.property_type_id,
  samples.title,
  'A welcoming Sidi Bouzid ' || lower(property_type.name) ||
  ' close to the Atlantic beach, with comfortable interiors, Wi-Fi, and space to unwind.',
  samples.price, 'night', admin_user.first_name || ' ' || admin_user.last_name,
  COALESCE(admin_user.phone, '+212600000000'), 'demo-listings@immoove.local',
  'approved', true, samples.image_url, 'VACATION_RENTAL', samples.capacity,
  samples.bedrooms, GREATEST(samples.bedrooms, samples.capacity / 2), samples.bathrooms,
  CASE WHEN samples.series IN (2, 5) THEN 'both' ELSE 'short_term' END,
  now() - make_interval(days => 80 - samples.series * 4),
  now() - make_interval(days => 79 - samples.series * 4), admin_user.user_id,
  now() - make_interval(days => 80 - samples.series * 4)
FROM samples
CROSS JOIN destination
CROSS JOIN admin_user
JOIN categories category ON category.slug = 'housing'
JOIN property_types property_type ON property_type.slug = samples.type_slug
WHERE NOT EXISTS (SELECT 1 FROM listings existing WHERE existing.title = samples.title);

INSERT INTO listing_images (listing_id, url, sort_order)
SELECT l.listing_id, l.cover_image_url, 0
FROM listings l
WHERE l.title LIKE '% · Sidi Bouzid'
  AND NOT EXISTS (SELECT 1 FROM listing_images li WHERE li.listing_id = l.listing_id AND li.sort_order = 0);

INSERT INTO listing_features (listing_id, feature_id)
SELECT l.listing_id, f.feature_id
FROM listings l
JOIN features f ON f.name IN ('Wi-Fi', 'Sea view', 'Kitchen', 'Parking', 'Terrace')
WHERE l.title LIKE '% · Sidi Bouzid'
ON CONFLICT (listing_id, feature_id) DO NOTHING;
