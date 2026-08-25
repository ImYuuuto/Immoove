INSERT INTO features (name)
SELECT value
FROM unnest(ARRAY[
    'Air conditioning', 'Family friendly', 'Equipment included',
    'Outdoor space', 'Automatic transmission'
]) AS value
WHERE NOT EXISTS (SELECT 1 FROM features WHERE name = value);

WITH sample_listings (
    category_slug, title, description, base_price, pricing_unit,
    service_type, guest_capacity, cover_image_url
) AS (
    VALUES
        ('housing', 'Ocean View Family Villa', 'A spacious coastal villa with a private terrace, bright rooms, and easy beach access.', 720, 'night', 'VACATION_RENTAL', 8, 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d'),
        ('housing', 'Sunny Garden Apartment', 'A calm apartment with a sunny garden, modern kitchen, and space for the whole family.', 360, 'night', 'VACATION_RENTAL', 4, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'),
        ('services', 'Coastal Table Catering', 'Fresh local catering for family lunches, celebrations, and small private events.', 450, 'service', NULL, 20, 'https://images.unsplash.com/photo-1555244162-803834f70033'),
        ('services', 'Home Cleaning Service', 'A reliable cleaning service for apartments, villas, and holiday properties.', 120, 'service', NULL, NULL, 'https://images.unsplash.com/photo-1581578731548-c64695cc6952'),
        ('hobbies-and-activities', 'Surf Lesson by the Beach', 'A friendly guided surf lesson with board, wetsuit, and safety equipment included.', 180, 'hour', 'ACTIVITY', 6, 'https://images.unsplash.com/photo-1502680390469-be75c86b636f'),
        ('hobbies-and-activities', 'Sunset Horse Riding', 'A guided sunset ride along quiet coastal trails for beginners and experienced riders.', 250, 'service', 'ACTIVITY', 8, 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a'),
        ('renting-cars', 'Compact Automatic City Car', 'An economical automatic car that is easy to drive and ideal for local trips.', 280, 'day', 'CAR_RENTAL', 5, 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2'),
        ('renting-cars', 'Family SUV Rental', 'A comfortable SUV with generous luggage space for family outings and longer journeys.', 480, 'day', 'CAR_RENTAL', 7, 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b')
)
INSERT INTO listings (
    provider_id, category_id, location_id, title, description, base_price,
    pricing_unit, contact_name, contact_phone, contact_email, cover_image_url,
    service_type, guest_capacity, status, is_active
)
SELECT
    u.user_id, c.category_id, l.location_id, s.title, s.description,
    s.base_price, s.pricing_unit, 'Karim Salah', '+212 600 000 000',
    'karim@example.com', s.cover_image_url, s.service_type,
    s.guest_capacity, 'approved', true
FROM sample_listings s
JOIN categories c ON c.slug = s.category_slug
JOIN users u ON u.email = 'karim@example.com'
LEFT JOIN LATERAL (
    SELECT location_id
    FROM locations
    WHERE name = 'Sidi Bouzid'
    ORDER BY location_id
    LIMIT 1
) l ON true
WHERE NOT EXISTS (SELECT 1 FROM listings existing WHERE existing.title = s.title);

WITH sample_images (title, url, sort_order) AS (
    VALUES
        ('Ocean View Family Villa', 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea', 1),
        ('Ocean View Family Villa', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3', 2),
        ('Sunny Garden Apartment', 'https://images.unsplash.com/photo-1493809842364-78817add7ffb', 1),
        ('Coastal Table Catering', 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3', 1),
        ('Home Cleaning Service', 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac', 1),
        ('Surf Lesson by the Beach', 'https://images.unsplash.com/photo-1455729552865-3658a5d39692', 1),
        ('Sunset Horse Riding', 'https://images.unsplash.com/photo-1508343919546-4a5792fee935', 1),
        ('Compact Automatic City Car', 'https://images.unsplash.com/photo-1502877338535-766e1452684a', 1),
        ('Family SUV Rental', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf', 1)
)
INSERT INTO listing_images (listing_id, url, sort_order)
SELECT l.listing_id, image.url, image.sort_order
FROM sample_images image
JOIN listings l ON l.title = image.title
WHERE NOT EXISTS (
    SELECT 1 FROM listing_images existing
    WHERE existing.listing_id = l.listing_id AND existing.url = image.url
);

WITH sample_features (title, feature_name) AS (
    VALUES
        ('Ocean View Family Villa', 'Wi-Fi'),
        ('Ocean View Family Villa', 'Parking'),
        ('Ocean View Family Villa', 'Air conditioning'),
        ('Sunny Garden Apartment', 'Wi-Fi'),
        ('Sunny Garden Apartment', 'Family friendly'),
        ('Coastal Table Catering', 'Family friendly'),
        ('Home Cleaning Service', 'Equipment included'),
        ('Surf Lesson by the Beach', 'Equipment included'),
        ('Sunset Horse Riding', 'Outdoor space'),
        ('Compact Automatic City Car', 'Automatic transmission'),
        ('Family SUV Rental', 'Air conditioning')
)
INSERT INTO listing_features (listing_id, feature_id)
SELECT l.listing_id, f.feature_id
FROM sample_features sample
JOIN listings l ON l.title = sample.title
JOIN features f ON f.name = sample.feature_name
ON CONFLICT (listing_id, feature_id) DO NOTHING;
