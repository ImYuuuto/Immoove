-- Rich, repeatable demo catalogue for non-production/sample environments.
-- All generated records carry an @demo.immoove.local marker so they remain
-- distinguishable from real customer data.

INSERT INTO features (name)
SELECT feature_name
FROM unnest(ARRAY['Wi-Fi', 'Pool', 'Sea view', 'Kitchen', 'Parking', 'Terrace']) AS feature_name
WHERE NOT EXISTS (SELECT 1 FROM features f WHERE lower(f.name) = lower(feature_name));

WITH demo_users(first_name, last_name, email, phone, avatar_seed, joined_days_ago) AS (
  VALUES
    ('Nadia', 'El Mansouri', 'nadia@demo.immoove.local', '+212610000101', 11, 420),
    ('Youssef', 'Amrani', 'youssef@demo.immoove.local', '+212610000102', 12, 380),
    ('Salma', 'Bennani', 'salma@demo.immoove.local', '+212610000103', 13, 340),
    ('Omar', 'Alaoui', 'omar@demo.immoove.local', '+212610000104', 14, 300),
    ('Imane', 'Tazi', 'imane@demo.immoove.local', '+212610000105', 15, 260),
    ('Hamza', 'Idrissi', 'hamza@demo.immoove.local', '+212610000106', 16, 220),
    ('Sara', 'Chraibi', 'sara@demo.immoove.local', '+212610000107', 17, 180),
    ('Mehdi', 'Fassi', 'mehdi@demo.immoove.local', '+212610000108', 18, 150),
    ('Lina', 'Berrada', 'lina@demo.immoove.local', '+212610000109', 19, 120),
    ('Adam', 'Naciri', 'adam@demo.immoove.local', '+212610000110', 20, 90),
    ('Meryem', 'Lahlou', 'meryem@demo.immoove.local', '+212610000111', 21, 60),
    ('Ayoub', 'Saidi', 'ayoub@demo.immoove.local', '+212610000112', 22, 30)
)
INSERT INTO users (
  first_name, last_name, email, phone, password_hash, role, account_status,
  avatar_url, created_at, terms_accepted_at, terms_version, privacy_accepted_at
)
SELECT first_name, last_name, email, phone,
  'scrypt:4d6f726f63636f496d6d6f6f766521:7b61ba8e55ba9f63bbd41d3c4cd572d8eb48240768611dc1b9760900b8ba051df4e5912b9bd21e96ec3c8b9a10b2508c30549d8b6089a11c4b59d86a213bf147',
  'CLIENT', 'active', 'https://i.pravatar.cc/256?img=' || avatar_seed,
  now() - make_interval(days => joined_days_ago), now() - make_interval(days => joined_days_ago),
  '1.0', now() - make_interval(days => joined_days_ago)
FROM demo_users
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_legal_consents
  (user_id, document_type, document_version, accepted_at, accepted_language)
SELECT u.user_id, d.document_type, d.version, COALESCE(u.terms_accepted_at, now()), 'en'
FROM users u
JOIN legal_documents d ON d.is_current = true
WHERE u.email LIKE '%@demo.immoove.local'
ON CONFLICT (user_id, document_type, document_version) DO NOTHING;

WITH active_cities AS (
  SELECT c.city_id, c.name AS city_name,
    (SELECT a.area_id FROM areas a
     WHERE a.city_id = c.city_id AND a.is_active = true AND a.requires_review = false
     ORDER BY CASE WHEN lower(a.name) = lower(c.name) THEN 0 ELSE 1 END, a.area_id
     LIMIT 1) AS area_id
  FROM cities c
  JOIN regions r ON r.region_id = c.region_id
  WHERE c.is_active = true AND r.is_active = true
    AND c.name <> 'Unassigned' AND r.name <> 'Unassigned'
), demo_properties AS (
  SELECT city_id, city_name, area_id, series,
    (ARRAY['Medina Courtyard Apartment', 'Sunlit City Studio', 'Palm Garden Villa',
           'Contemporary Terrace Apartment', 'Quiet Design Studio', 'Family Pool Villa',
           'Old Town Balcony Apartment', 'Panoramic Escape Villa'])[series] || ' · ' || city_name AS title,
    (ARRAY['apartment','studio','villa','apartment','studio','villa','apartment','villa'])[series] AS type_slug,
    (ARRAY[480,310,1250,620,360,1480,540,1720])[series] + city_id * 7 AS price,
    (ARRAY[4,2,8,5,2,10,4,9])[series] AS capacity,
    (ARRAY[2,1,4,3,1,5,2,4])[series] AS bedrooms,
    (ARRAY[1,1,3,2,1,4,2,3])[series] AS bathrooms,
    (ARRAY['/uploads/site/listings/maison-bleue.jpg',
           '/uploads/site/listings/dar-el-bahri.jpg',
           '/uploads/site/listings/villa-des-dunes.jpg'])[((series - 1) % 3) + 1] AS image_url
  FROM active_cities CROSS JOIN generate_series(1, 8) AS series
  WHERE area_id IS NOT NULL
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
SELECT admin_user.user_id, category.category_id, p.area_id, property_type.property_type_id,
  p.title,
  'A carefully prepared ' || lower(property_type.name) || ' in ' || p.city_name ||
  ' with comfortable interiors, reliable Wi-Fi, local character, and easy access to nearby attractions.',
  p.price, 'night', admin_user.first_name || ' ' || admin_user.last_name,
  COALESCE(admin_user.phone, '+212600000000'), 'demo-listings@immoove.local',
  'approved', true, p.image_url, 'VACATION_RENTAL', p.capacity,
  p.bedrooms, GREATEST(p.bedrooms, p.capacity / 2), p.bathrooms,
  CASE WHEN p.series IN (2, 5) THEN 'both' ELSE 'short_term' END,
  now() - make_interval(days => 120 - p.series * 5),
  now() - make_interval(days => 119 - p.series * 5), admin_user.user_id,
  now() - make_interval(days => 120 - p.series * 5)
FROM demo_properties p
CROSS JOIN admin_user
JOIN categories category ON category.slug = 'housing'
JOIN property_types property_type ON property_type.slug = p.type_slug
WHERE NOT EXISTS (
  SELECT 1 FROM listings existing
  WHERE existing.title = p.title AND existing.contact_email = 'demo-listings@immoove.local'
);

INSERT INTO listing_images (listing_id, url, sort_order)
SELECT l.listing_id, l.cover_image_url, 0
FROM listings l
WHERE l.contact_email = 'demo-listings@immoove.local'
  AND l.service_type = 'VACATION_RENTAL'
  AND l.cover_image_url LIKE '/uploads/site/listings/%'
  AND NOT EXISTS (SELECT 1 FROM listing_images li WHERE li.listing_id = l.listing_id AND li.sort_order = 0);

WITH demo_listings AS (
  SELECT l.listing_id, row_number() OVER (ORDER BY l.listing_id) AS number
  FROM listings l
  WHERE l.contact_email = 'demo-listings@immoove.local'
), demo_features AS (
  SELECT feature_id, row_number() OVER (ORDER BY feature_id) AS number
  FROM features WHERE name IN ('Wi-Fi', 'Pool', 'Sea view', 'Kitchen', 'Parking', 'Terrace')
)
INSERT INTO listing_features (listing_id, feature_id)
SELECT l.listing_id, f.feature_id
FROM demo_listings l JOIN demo_features f ON ((l.number + f.number) % 3) <> 0
ON CONFLICT (listing_id, feature_id) DO NOTHING;

WITH demo_users AS (
  SELECT user_id, first_name, last_name, email, phone,
    row_number() OVER (ORDER BY user_id) AS number
  FROM users WHERE email LIKE '%@demo.immoove.local'
), demo_listings AS (
  SELECT listing_id, base_price, row_number() OVER (ORDER BY listing_id) AS number,
    count(*) OVER () AS total_count
  FROM listings
  WHERE contact_email = 'demo-listings@immoove.local'
), booking_samples AS (
  SELECT u.*, l.listing_id, l.base_price,
    now() - make_interval(days => (95 - u.number * 3)::integer) AS past_start,
    now() - make_interval(days => (91 - u.number * 3)::integer) AS past_end,
    now() + make_interval(days => (8 + u.number * 2)::integer) AS future_start,
    now() + make_interval(days => (11 + u.number * 2)::integer) AS future_end
  FROM demo_users u
  JOIN demo_listings l ON l.number = ((u.number * 2 - 1) % l.total_count) + 1
)
INSERT INTO bookings (
  listing_id, user_id, start_date, end_date, total,
  contact_first_name, contact_last_name, contact_email, contact_phone,
  status, payment_status, currency, created_at
)
SELECT listing_id, user_id, past_start, past_end, base_price * 4,
  first_name, last_name, email, phone, 'completed', 'paid', 'MAD', past_start - interval '25 days'
FROM booking_samples
WHERE NOT EXISTS (
  SELECT 1 FROM bookings b WHERE b.user_id = booking_samples.user_id AND b.start_date = booking_samples.past_start
)
UNION ALL
SELECT listing_id, user_id, future_start, future_end, base_price * 3,
  first_name, last_name, email, phone, 'confirmed', 'paid', 'MAD', now() - interval '5 days'
FROM booking_samples
WHERE NOT EXISTS (
  SELECT 1 FROM bookings b WHERE b.user_id = booking_samples.user_id AND b.start_date = booking_samples.future_start
);

WITH review_samples(number, rating, comment) AS (
  VALUES
    (1, 5, 'Beautiful place, spotless rooms, and a very smooth arrival.'),
    (2, 4, 'Comfortable stay and a great location for exploring the city.'),
    (3, 5, 'The terrace was wonderful and the home looked exactly like the photos.'),
    (4, 4, 'Friendly welcome, reliable Wi-Fi, and everything we needed.'),
    (5, 5, 'A calm and memorable stay. We would happily return.'),
    (6, 3, 'Good overall stay with a convenient location and helpful host.'),
    (7, 5, 'Perfect for our family trip; spacious, clean, and well equipped.'),
    (8, 4, 'Lovely local character and an easy check-in experience.'),
    (9, 5, 'Excellent value and one of the best stays from our Morocco trip.'),
    (10, 4, 'Bright rooms, comfortable beds, and a pleasant neighborhood.'),
    (11, 5, 'Everything was thoughtfully prepared before we arrived.'),
    (12, 4, 'A relaxing stay with plenty of space and a beautiful setting.')
), completed_demo_bookings AS (
  SELECT b.booking_id, row_number() OVER (ORDER BY b.booking_id) AS number
  FROM bookings b JOIN users u ON u.user_id = b.user_id
  WHERE u.email LIKE '%@demo.immoove.local' AND b.status = 'completed'
)
INSERT INTO reviews (booking_id, rating, comment, created_at)
SELECT b.booking_id, r.rating, r.comment, now() - make_interval(days => (45 - b.number)::integer)
FROM completed_demo_bookings b
JOIN review_samples r ON r.number = ((b.number - 1) % 12) + 1
WHERE NOT EXISTS (SELECT 1 FROM reviews existing WHERE existing.booking_id = b.booking_id);
