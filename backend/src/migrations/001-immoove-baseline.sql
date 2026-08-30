-- Consolidated from 001-create-schema.sql

CREATE TABLE IF NOT EXISTS users (
    user_id serial PRIMARY KEY,
    first_name text,
    last_name text,
    email text UNIQUE NOT NULL,
    phone text,
    role text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
    category_id serial PRIMARY KEY,
    name text NOT NULL,
    slug text UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS locations (
    location_id serial PRIMARY KEY,
    name text NOT NULL,
    lat numeric,
    lng numeric
);

CREATE TABLE IF NOT EXISTS listings (
    listing_id serial PRIMARY KEY,
    provider_id integer REFERENCES users (user_id) ON DELETE SET NULL,
    category_id integer REFERENCES categories (category_id),
    location_id integer REFERENCES locations (location_id),
    title text NOT NULL,
    description text,
    base_price numeric NOT NULL,
    pricing_unit text,
    contact_name text,
    contact_phone text,
    contact_email text,
    status text NOT NULL CHECK (
        status IN (
            'approved',
            'pending',
            'rejected'
        )
    ),
    is_active boolean DEFAULT false,
    cover_image_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS listing_images (
    id serial PRIMARY KEY,
    listing_id int REFERENCES listings (listing_id) ON DELETE CASCADE,
    url text NOT NULL,
    sort_order int DEFAULT 0
);

CREATE TABLE IF NOT EXISTS features (
    feature_id serial PRIMARY KEY,
    name text NOT NULL
);

CREATE TABLE IF NOT EXISTS listing_features (
    listing_id int REFERENCES listings (listing_id) ON DELETE CASCADE,
    feature_id int REFERENCES features (feature_id),
    PRIMARY KEY (listing_id, feature_id)
);

CREATE TABLE IF NOT EXISTS bookings (
    booking_id serial PRIMARY KEY,
    listing_id int REFERENCES listings (listing_id) ON DELETE CASCADE,
    user_id int REFERENCES users (user_id) ON DELETE CASCADE,
    start_date timestamptz,
    end_date timestamptz,
    total numeric,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reviews (
    review_id serial PRIMARY KEY,
    booking_id int REFERENCES bookings (booking_id) ON DELETE CASCADE,
    rating int CHECK (rating BETWEEN 1 AND 5),
    comment text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id serial PRIMARY KEY,
    actor_id int REFERENCES users (user_id) ON DELETE SET NULL,
    action text,
    entity_type text,
    entity_id int,
    reason text,
    created_at timestamptz DEFAULT now()
);

-- Consolidated from 002-seed-data.sql

INSERT INTO
    users (
        first_name,
        last_name,
        email,
        role
    )
VALUES (
        'Amina',
        'Bouzid',
        'amina@example.com',
        'admin'
    ),
    (
        'Karim',
        'Salah',
        'karim@example.com',
        'provider'
    ),
    (
        'Nour',
        'Ali',
        'nour@example.com',
        'user'
    )
ON CONFLICT (email) DO NOTHING;

INSERT INTO
    categories (name, slug)
VALUES ('Homes', 'homes'),
    ('Experiences', 'experiences')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO
    locations (name, lat, lng)
VALUES (
        'Sidi Bouzid',
        35.0382,
        9.4858
    )
ON CONFLICT DO NOTHING;

INSERT INTO
    features (name)
SELECT value
FROM unnest(
        ARRAY[
            'Wi-Fi', 'Parking', 'Sea view'
        ]
    ) AS value
WHERE
    NOT EXISTS (
        SELECT 1
        FROM features f
        WHERE
            f.name = value
    );

INSERT INTO
    listings (
        provider_id,
        category_id,
        location_id,
        title,
        description,
        base_price,
        pricing_unit,
        contact_name,
        status,
        is_active
    )
SELECT u.user_id, c.category_id, l.location_id, 'Dar El Bahia', 'A bright local stay near the old town.', 85, 'night', 'Karim Salah', 'approved', true
FROM users u, categories c, locations l
WHERE
    u.email = 'karim@example.com'
    AND c.slug = 'homes'
    AND l.name = 'Sidi Bouzid'
    AND NOT EXISTS (
        SELECT 1
        FROM listings
        WHERE
            title = 'Dar El Bahia'
    );

INSERT INTO
    listing_images (listing_id, url, sort_order)
SELECT listing_id, '/uploads/site/listings/maison-bleue.jpg', 0
FROM listings
WHERE
    title = 'Dar El Bahia'
    AND NOT EXISTS (
        SELECT 1
        FROM listing_images
        WHERE
            listing_id = listings.listing_id
    );

INSERT INTO
    bookings (
        listing_id,
        user_id,
        start_date,
        end_date,
        total
    )
SELECT l.listing_id, u.user_id, now() + interval '7 days', now() + interval '9 days', 170
FROM listings l, users u
WHERE
    l.title = 'Dar El Bahia'
    AND u.email = 'nour@example.com'
    AND NOT EXISTS (
        SELECT 1
        FROM bookings
        WHERE
            listing_id = l.listing_id
    );

-- Consolidated from 003-platform-features.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash text;

UPDATE users
SET
    password_hash = 'scrypt:bef73c743464747f034322160ba2beb2:671de337b8359cc1754eb92fbd40911299d4a8962c740b6740822c3c45644eed555789063f3b2d790f88ee0cc5405564535f4557e4022f3420282d8d441ef5b0'
WHERE
    email = 'amina@example.com'
    AND password_hash IS NULL;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
ADD CONSTRAINT users_role_check CHECK (
    role IS NULL
    OR role IN (
        'CLIENT',
        'HOST',
        'ADMIN',
        'client',
        'provider',
        'staff',
        'moderator',
        'admin',
        'user'
    )
);

ALTER TABLE listings ADD COLUMN IF NOT EXISTS service_type text;

ALTER TABLE listings ADD COLUMN IF NOT EXISTS guest_capacity integer;

ALTER TABLE listings
ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

ALTER TABLE listings
DROP CONSTRAINT IF EXISTS listings_service_type_check;

ALTER TABLE listings
ADD CONSTRAINT listings_service_type_check CHECK (
    service_type IS NULL
    OR service_type IN (
        'VACATION_RENTAL',
        'CAR_RENTAL',
        'RESTAURANT_CAFE',
        'ACTIVITY'
    )
);

CREATE INDEX IF NOT EXISTS listings_search_idx ON listings (
    service_type,
    base_price,
    guest_capacity,
    is_active,
    status
);

CREATE TABLE IF NOT EXISTS listing_categories (
    listing_id integer NOT NULL REFERENCES listings (listing_id) ON DELETE CASCADE,
    category_id integer NOT NULL REFERENCES categories (category_id) ON DELETE CASCADE,
    PRIMARY KEY (listing_id, category_id)
);

CREATE TABLE IF NOT EXISTS announcement_requests (
    request_id serial PRIMARY KEY,
    requester_id integer REFERENCES users (user_id) ON DELETE SET NULL,
    service_type text NOT NULL CHECK (
        service_type IN (
            'VACATION_RENTAL',
            'CAR_RENTAL',
            'RESTAURANT_CAFE',
            'ACTIVITY'
        )
    ),
    title text NOT NULL,
    description text,
    address text NOT NULL,
    contact_phone text,
    status text NOT NULL DEFAULT 'PENDING' CHECK (
        status IN (
            'PENDING',
            'APPROVED',
            'REJECTED'
        )
    ),
    reviewed_by integer REFERENCES users (user_id) ON DELETE SET NULL,
    review_reason text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS announcement_requests_status_idx ON announcement_requests (status, created_at DESC);

CREATE TABLE IF NOT EXISTS blog_posts (
    post_id serial PRIMARY KEY,
    author_id integer REFERENCES users (user_id) ON DELETE SET NULL,
    category text NOT NULL CHECK (
        category IN (
            'IDEAS_INSPIRATION',
            'WELLBEING_BALANCE'
        )
    ),
    slug text UNIQUE NOT NULL,
    title text NOT NULL,
    excerpt text,
    content text NOT NULL,
    cover_image_url text,
    is_published boolean NOT NULL DEFAULT false,
    published_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS blog_posts_published_idx ON blog_posts (
    is_published,
    published_at DESC
);

CREATE TABLE IF NOT EXISTS favorites (
    user_id integer NOT NULL REFERENCES users (user_id) ON DELETE CASCADE,
    listing_id integer NOT NULL REFERENCES listings (listing_id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, listing_id)
);

-- Upgrade foreign keys created by older schema versions. User-owned bookings
-- are removed with their user, while listings and audit history are retained
-- through their existing nullable references.
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_user_id_fkey;
ALTER TABLE bookings
ADD CONSTRAINT bookings_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE;

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_listing_id_fkey;
ALTER TABLE bookings
ADD CONSTRAINT bookings_listing_id_fkey
FOREIGN KEY (listing_id) REFERENCES listings (listing_id) ON DELETE CASCADE;

ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_actor_id_fkey;
ALTER TABLE audit_logs
ADD CONSTRAINT audit_logs_actor_id_fkey
FOREIGN KEY (actor_id) REFERENCES users (user_id) ON DELETE SET NULL;

-- Consolidated from 004-reset-dev-admin-password.sql

-- Development-only admin credential reset.
UPDATE users
SET
    password_hash = 'scrypt:a881f76777e66eaa1c2d13983377e483:131adc35d298e65fdd55dcb4d493b567ea5c20c0486634421175502aa8b6bd300494418e4678a587dcba3fa5315f19d755c612083cdaa0f20701bdbb9f85f58a'
WHERE
    email = 'amina@example.com';

-- Consolidated from 005-add-session-version.sql

ALTER TABLE users
ADD COLUMN IF NOT EXISTS session_version integer NOT NULL DEFAULT 0;

-- Consolidated from 006-profile-ownership.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url text;

ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_provider_id_fkey;
ALTER TABLE listings
ADD CONSTRAINT listings_provider_id_fkey
FOREIGN KEY (provider_id) REFERENCES users (user_id) ON DELETE CASCADE;

ALTER TABLE announcement_requests
DROP CONSTRAINT IF EXISTS announcement_requests_requester_id_fkey;
ALTER TABLE announcement_requests
ADD CONSTRAINT announcement_requests_requester_id_fkey
FOREIGN KEY (requester_id) REFERENCES users (user_id) ON DELETE CASCADE;

ALTER TABLE announcement_requests
DROP CONSTRAINT IF EXISTS announcement_requests_reviewed_by_fkey;
ALTER TABLE announcement_requests
ADD CONSTRAINT announcement_requests_reviewed_by_fkey
FOREIGN KEY (reviewed_by) REFERENCES users (user_id) ON DELETE SET NULL;

ALTER TABLE blog_posts DROP CONSTRAINT IF EXISTS blog_posts_author_id_fkey;
ALTER TABLE blog_posts
ADD CONSTRAINT blog_posts_author_id_fkey
FOREIGN KEY (author_id) REFERENCES users (user_id) ON DELETE CASCADE;

ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_actor_id_fkey;
ALTER TABLE audit_logs
ADD CONSTRAINT audit_logs_actor_id_fkey
FOREIGN KEY (actor_id) REFERENCES users (user_id) ON DELETE SET NULL;

-- Consolidated from 007-booking-contact.sql

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS contact_first_name text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS contact_last_name text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS contact_email text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS contact_phone text;

-- Consolidated from 008-listing-categories.sql

INSERT INTO categories (name, slug)
VALUES
    ('Housing', 'housing'),
    ('Services', 'services'),
    ('Hobbies and Activities', 'hobbies-and-activities'),
    ('Renting Cars', 'renting-cars')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

UPDATE listings
SET category_id = (SELECT category_id FROM categories WHERE slug = 'housing')
WHERE service_type = 'VACATION_RENTAL'
   OR category_id = (SELECT category_id FROM categories WHERE slug = 'homes');

UPDATE listings
SET category_id = (SELECT category_id FROM categories WHERE slug = 'renting-cars')
WHERE service_type = 'CAR_RENTAL';

UPDATE listings
SET category_id = (SELECT category_id FROM categories WHERE slug = 'hobbies-and-activities')
WHERE service_type = 'ACTIVITY'
   OR category_id = (SELECT category_id FROM categories WHERE slug = 'experiences');

UPDATE listings
SET category_id = (SELECT category_id FROM categories WHERE slug = 'services')
WHERE service_type = 'RESTAURANT_CAFE';

-- Consolidated from 009-localize-seed-images.sql

UPDATE listing_images
SET url = '/uploads/site/listings/maison-bleue.jpg'
WHERE url LIKE 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c%';

-- Consolidated from 010-staff-dashboards.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active';
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_account_status_check;
ALTER TABLE users ADD CONSTRAINT users_account_status_check
CHECK (account_status IN ('active', 'suspended'));

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'confirmed';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'MAD';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
CHECK (status IN ('confirmed', 'cancelled', 'completed', 'refunded'));
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_payment_status_check
CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'refunded'));

ALTER TABLE listings ADD COLUMN IF NOT EXISTS submitted_at timestamptz;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS reviewed_by integer REFERENCES users (user_id) ON DELETE SET NULL;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS rejection_reason text;
UPDATE listings SET submitted_at = COALESCE(submitted_at, created_at);

CREATE TABLE IF NOT EXISTS moderation_cases (
    case_id serial PRIMARY KEY,
    entity_type text NOT NULL CHECK (entity_type IN ('listing', 'announcement')),
    entity_id integer NOT NULL,
    assigned_to integer REFERENCES users (user_id) ON DELETE SET NULL,
    priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'claimed', 'decided', 'escalated')),
    due_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (entity_type, entity_id)
);

CREATE TABLE IF NOT EXISTS moderation_decisions (
    decision_id serial PRIMARY KEY,
    case_id integer NOT NULL REFERENCES moderation_cases (case_id) ON DELETE CASCADE,
    actor_id integer REFERENCES users (user_id) ON DELETE SET NULL,
    decision text NOT NULL CHECK (decision IN ('approved', 'rejected', 'changes_requested', 'escalated')),
    reason_code text NOT NULL,
    note text,
    previous_state jsonb,
    next_state jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS moderation_cases_queue_idx
ON moderation_cases (status, priority, due_at, created_at);
CREATE INDEX IF NOT EXISTS moderation_cases_assignee_idx
ON moderation_cases (assigned_to, status, due_at);
CREATE INDEX IF NOT EXISTS moderation_decisions_actor_idx
ON moderation_decisions (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS bookings_dashboard_idx
ON bookings (status, created_at DESC);
CREATE INDEX IF NOT EXISTS users_dashboard_idx
ON users (account_status, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_dashboard_idx
ON audit_logs (created_at DESC, actor_id, entity_type);

INSERT INTO moderation_cases (entity_type, entity_id, created_at, due_at)
SELECT 'listing', listing_id, COALESCE(submitted_at, created_at), COALESCE(submitted_at, created_at) + interval '24 hours'
FROM listings
WHERE status = 'pending'
ON CONFLICT (entity_type, entity_id) DO NOTHING;

INSERT INTO moderation_cases (entity_type, entity_id, created_at, due_at)
SELECT 'announcement', request_id, created_at, created_at + interval '24 hours'
FROM announcement_requests
WHERE status = 'PENDING'
ON CONFLICT (entity_type, entity_id) DO NOTHING;

-- Consolidated from 011-category-sample-listings.sql

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

-- Consolidated from 012-publication-moderation.sql

ALTER TABLE bookings ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS processed_by integer REFERENCES users(user_id) ON DELETE SET NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS processed_at timestamptz;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
CHECK (status IN ('pending','processing','confirmed','rejected','cancelled','completed','refunded'));

ALTER TABLE listings ADD COLUMN IF NOT EXISTS map_url text;

ALTER TABLE announcement_requests ADD COLUMN IF NOT EXISTS category_id integer REFERENCES categories(category_id);
ALTER TABLE announcement_requests ADD COLUMN IF NOT EXISTS map_url text;
ALTER TABLE announcement_requests ADD COLUMN IF NOT EXISTS base_price numeric;
ALTER TABLE announcement_requests ADD COLUMN IF NOT EXISTS pricing_unit text;
ALTER TABLE announcement_requests ADD COLUMN IF NOT EXISTS guest_capacity integer;
ALTER TABLE announcement_requests ADD COLUMN IF NOT EXISTS contact_name text;
ALTER TABLE announcement_requests ADD COLUMN IF NOT EXISTS contact_email text;
ALTER TABLE announcement_requests DROP CONSTRAINT IF EXISTS announcement_requests_status_check;
ALTER TABLE announcement_requests ADD CONSTRAINT announcement_requests_status_check
CHECK (status IN ('PENDING','ESCALATED','APPROVED','REJECTED'));
ALTER TABLE announcement_requests DROP CONSTRAINT IF EXISTS announcement_requests_pricing_unit_check;
ALTER TABLE announcement_requests ADD CONSTRAINT announcement_requests_pricing_unit_check
CHECK (pricing_unit IS NULL OR pricing_unit IN ('night','day','hour','service'));

CREATE TABLE IF NOT EXISTS announcement_request_images (
  id serial PRIMARY KEY,
  request_id integer NOT NULL REFERENCES announcement_requests(request_id) ON DELETE CASCADE,
  url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE moderation_cases DROP CONSTRAINT IF EXISTS moderation_cases_entity_type_check;
ALTER TABLE moderation_cases ADD CONSTRAINT moderation_cases_entity_type_check
CHECK (entity_type IN ('listing','announcement','booking'));

INSERT INTO moderation_cases (entity_type, entity_id, created_at, due_at)
SELECT 'booking', booking_id, created_at, created_at + interval '4 hours'
FROM bookings WHERE status IN ('pending','processing')
ON CONFLICT (entity_type, entity_id) DO NOTHING;

-- Consolidated from 013-query-indexes.sql

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

-- Consolidated from 014-housing-role-location-normalization.sql

LOCK TABLE users, listings, moderation_cases IN SHARE ROW EXCLUSIVE MODE;

-- Exact rollback snapshots. These are intentionally retained until the
-- migration has passed its production retention window.
CREATE TABLE IF NOT EXISTS migration_014_users_backup (
    user_id integer PRIMARY KEY,
    role text,
    account_status text NOT NULL,
    session_version integer NOT NULL
);
INSERT INTO migration_014_users_backup (user_id, role, account_status, session_version)
SELECT user_id, role, account_status, session_version FROM users
ON CONFLICT (user_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS migration_014_listings_backup (
    listing_id integer PRIMARY KEY,
    status text NOT NULL,
    is_active boolean NOT NULL,
    archived_at timestamptz,
    archive_reason text
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_version text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_accepted_at timestamptz;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_terms_acceptance_check;
ALTER TABLE users ADD CONSTRAINT users_terms_acceptance_check CHECK (
    (terms_accepted_at IS NULL AND terms_version IS NULL)
    OR (terms_accepted_at IS NOT NULL AND NULLIF(trim(terms_version), '') IS NOT NULL)
);

ALTER TABLE listings ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS archive_reason text;

INSERT INTO migration_014_listings_backup
    (listing_id, status, is_active, archived_at, archive_reason)
SELECT listing_id, status, is_active, archived_at, archive_reason FROM listings
ON CONFLICT (listing_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS migration_014_moderation_backup (
    case_id integer PRIMARY KEY,
    status text NOT NULL,
    assigned_to integer,
    updated_at timestamptz NOT NULL
);
INSERT INTO migration_014_moderation_backup (case_id, status, assigned_to, updated_at)
SELECT case_id, status, assigned_to, updated_at FROM moderation_cases
ON CONFLICT (case_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS property_types (
    property_type_id serial PRIMARY KEY,
    name text NOT NULL UNIQUE,
    slug text NOT NULL UNIQUE,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO property_types (name, slug) VALUES
    ('Apartment', 'apartment'),
    ('House', 'house'),
    ('Villa', 'villa'),
    ('Guest house', 'guest-house'),
    ('Room', 'room'),
    ('Other', 'other')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

ALTER TABLE listings ADD COLUMN IF NOT EXISTS property_type_id integer
    REFERENCES property_types(property_type_id) ON DELETE RESTRICT;

CREATE TABLE IF NOT EXISTS regions (
    region_id serial PRIMARY KEY,
    name text NOT NULL UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS cities (
    city_id serial PRIMARY KEY,
    region_id integer NOT NULL REFERENCES regions(region_id) ON DELETE RESTRICT,
    name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (region_id, name)
);
CREATE TABLE IF NOT EXISTS areas (
    area_id serial PRIMARY KEY,
    city_id integer NOT NULL REFERENCES cities(city_id) ON DELETE RESTRICT,
    name text NOT NULL,
    legacy_location_id integer UNIQUE REFERENCES locations(location_id) ON DELETE SET NULL,
    lat numeric,
    lng numeric,
    requires_review boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE areas ADD COLUMN IF NOT EXISTS requires_review boolean NOT NULL DEFAULT false;

INSERT INTO regions (name) VALUES ('Casablanca-Settat'), ('Unassigned') ON CONFLICT (name) DO NOTHING;
INSERT INTO cities (region_id, name)
SELECT region_id, 'El Jadida' FROM regions WHERE name = 'Casablanca-Settat'
ON CONFLICT (region_id, name) DO NOTHING;
INSERT INTO cities (region_id, name)
SELECT region_id, 'Unassigned' FROM regions WHERE name = 'Unassigned'
ON CONFLICT (region_id, name) DO NOTHING;
INSERT INTO areas (city_id, name, legacy_location_id, lat, lng, requires_review)
SELECT c.city_id, l.name, l.location_id, l.lat, l.lng,
       NOT (lower(l.name) IN ('sidi bouzid', 'el jadida'))
FROM locations l
JOIN cities c ON (
    lower(l.name) IN ('sidi bouzid', 'el jadida') AND c.name = 'El Jadida'
) OR (
    lower(l.name) NOT IN ('sidi bouzid', 'el jadida') AND c.name = 'Unassigned'
)
JOIN regions r ON r.region_id = c.region_id AND (
    (c.name = 'El Jadida' AND r.name = 'Casablanca-Settat')
    OR (c.name = 'Unassigned' AND r.name = 'Unassigned')
)
ON CONFLICT (legacy_location_id) DO UPDATE
SET city_id = EXCLUDED.city_id, name = EXCLUDED.name, lat = EXCLUDED.lat,
    lng = EXCLUDED.lng, requires_review = EXCLUDED.requires_review;

ALTER TABLE listings ADD COLUMN IF NOT EXISTS area_id integer
    REFERENCES areas(area_id) ON DELETE RESTRICT;
UPDATE listings l SET area_id = a.area_id
FROM areas a WHERE a.legacy_location_id = l.location_id AND l.area_id IS NULL;

-- Housing providers become owners. Legacy staff/moderators become suspended
-- admins so no privilege is silently granted before manual review.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
UPDATE users SET role = 'ADMIN'
WHERE upper(COALESCE(role, '')) = 'ADMIN';
UPDATE users SET role = 'ADMIN', account_status = 'suspended'
WHERE lower(COALESCE(role, '')) IN ('moderator', 'staff');
UPDATE users u SET role = 'OWNER'
WHERE role <> 'ADMIN' AND EXISTS (
    SELECT 1 FROM listings l
    LEFT JOIN categories c ON c.category_id = l.category_id
    WHERE l.provider_id = u.user_id
      AND (c.slug = 'housing' OR l.service_type = 'VACATION_RENTAL')
);
UPDATE users SET role = 'CLIENT' WHERE role IS NULL OR role NOT IN ('ADMIN', 'OWNER');

-- Invalidate every token whose embedded role/account state no longer matches.
UPDATE users u SET session_version = b.session_version + 1
FROM migration_014_users_backup b
WHERE b.user_id = u.user_id
  AND (u.role IS DISTINCT FROM b.role OR u.account_status IS DISTINCT FROM b.account_status);

ALTER TABLE users ADD CONSTRAINT users_role_check
CHECK (role IN ('CLIENT', 'OWNER', 'ADMIN'));
ALTER TABLE users ALTER COLUMN role SET NOT NULL;
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'CLIENT';

-- Assign the closest property type using existing titles. Anything ambiguous
-- remains explicitly classified as Other rather than being guessed silently.
UPDATE listings l SET property_type_id = pt.property_type_id
FROM property_types pt
LEFT JOIN categories c ON c.slug = 'housing'
WHERE (l.service_type = 'VACATION_RENTAL' OR l.category_id = c.category_id)
  AND pt.slug = CASE
    WHEN lower(l.title) ~ '\mvilla\M' THEN 'villa'
    WHEN lower(l.title) ~ '\m(apartment|flat|studio)\M' THEN 'apartment'
    WHEN lower(l.title) ~ '\m(guesthouse|guest house|riad)\M' THEN 'guest-house'
    WHEN lower(l.title) ~ '\mroom\M' THEN 'room'
    WHEN lower(l.title) ~ '\m(house|home|maison)\M' THEN 'house'
    ELSE 'other'
  END;

-- Archive instead of deleting. All dependent history and foreign keys remain.
UPDATE listings l SET
    is_active = false,
    status = 'rejected',
    archived_at = COALESCE(archived_at, now()),
    archive_reason = COALESCE(archive_reason, 'Phase 2: non-housing listing archived')
WHERE NOT EXISTS (
    SELECT 1 FROM categories c
    WHERE c.category_id = l.category_id AND c.slug = 'housing'
) AND l.service_type IS DISTINCT FROM 'VACATION_RENTAL';

UPDATE moderation_cases mc SET status = 'decided', updated_at = now()
WHERE mc.entity_type = 'listing'
  AND EXISTS (SELECT 1 FROM listings l WHERE l.listing_id = mc.entity_id AND l.archived_at IS NOT NULL)
  AND mc.status <> 'decided';

CREATE INDEX IF NOT EXISTS listings_property_type_idx ON listings(property_type_id);
CREATE INDEX IF NOT EXISTS listings_area_idx ON listings(area_id);
CREATE INDEX IF NOT EXISTS cities_region_idx ON cities(region_id);
CREATE INDEX IF NOT EXISTS areas_city_idx ON areas(city_id);

-- Consolidated from 015-legal-consent.sql

CREATE TABLE IF NOT EXISTS legal_documents (
    document_type text NOT NULL CHECK (document_type IN ('terms', 'privacy')),
    version text NOT NULL,
    is_current boolean NOT NULL DEFAULT false,
    requires_reacceptance boolean NOT NULL DEFAULT false,
    effective_at date,
    published_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (document_type, version)
);

CREATE UNIQUE INDEX IF NOT EXISTS legal_documents_one_current_type_idx
ON legal_documents(document_type) WHERE is_current;

CREATE TABLE IF NOT EXISTS user_legal_consents (
    consent_id bigserial PRIMARY KEY,
    user_id integer NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    document_type text NOT NULL,
    document_version text NOT NULL,
    accepted_at timestamptz NOT NULL DEFAULT now(),
    accepted_language text NOT NULL CHECK (accepted_language IN ('en', 'fr', 'ar')),
    FOREIGN KEY (document_type, document_version)
        REFERENCES legal_documents(document_type, version) ON DELETE RESTRICT,
    UNIQUE (user_id, document_type, document_version)
);

CREATE INDEX IF NOT EXISTS user_legal_consents_user_type_idx
ON user_legal_consents(user_id, document_type, accepted_at DESC);

INSERT INTO legal_documents
    (document_type, version, is_current, requires_reacceptance, effective_at)
VALUES
    ('terms', '1.0', true, true, NULL),
    ('privacy', '1.0-draft', true, false, NULL)
ON CONFLICT (document_type, version) DO UPDATE SET
    is_current = EXCLUDED.is_current,
    requires_reacceptance = EXCLUDED.requires_reacceptance;

-- Preserve legacy acceptance evidence when both timestamp and version exist.
INSERT INTO user_legal_consents
    (user_id, document_type, document_version, accepted_at, accepted_language)
SELECT u.user_id, 'terms', u.terms_version, u.terms_accepted_at, 'en'
FROM users u
JOIN legal_documents d
  ON d.document_type = 'terms' AND d.version = u.terms_version
WHERE u.terms_accepted_at IS NOT NULL
ON CONFLICT (user_id, document_type, document_version) DO NOTHING;

CREATE OR REPLACE FUNCTION enforce_new_user_terms_consent()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM legal_documents d
        WHERE d.document_type = 'terms'
          AND d.is_current = true
          AND d.requires_reacceptance = true
          AND NOT EXISTS (
              SELECT 1 FROM user_legal_consents c
              WHERE c.user_id = NEW.user_id
                AND c.document_type = d.document_type
                AND c.document_version = d.version
          )
    ) THEN
        RAISE EXCEPTION 'A current Terms consent record is required for every new account'
            USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_require_terms_consent ON users;
CREATE CONSTRAINT TRIGGER users_require_terms_consent
AFTER INSERT ON users
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION enforce_new_user_terms_consent();

-- Consolidated from 016-morocco-wide-rebrand.sql

-- Rebrand only known development samples. Real user-owned location data remains intact.
UPDATE users SET
  password_hash = 'scrypt:4d6f726f63636f496d6d6f6f766521:7b61ba8e55ba9f63bbd41d3c4cd572d8eb48240768611dc1b9760900b8ba051df4e5912b9bd21e96ec3c8b9a10b2508c30549d8b6089a11c4b59d86a213bf147'
WHERE email = 'amina@example.com';

INSERT INTO locations (name, lat, lng)
SELECT 'Agadir', 30.4278, -9.5981
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Agadir');

INSERT INTO locations (name, lat, lng)
SELECT 'Marrakech', 31.6295, -7.9811
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Marrakech');

INSERT INTO regions (name) VALUES ('Souss-Massa'), ('Marrakech-Safi')
ON CONFLICT (name) DO NOTHING;

INSERT INTO cities (region_id, name)
SELECT region_id, 'Agadir' FROM regions WHERE name = 'Souss-Massa'
ON CONFLICT (region_id, name) DO NOTHING;

INSERT INTO cities (region_id, name)
SELECT region_id, 'Marrakech' FROM regions WHERE name = 'Marrakech-Safi'
ON CONFLICT (region_id, name) DO NOTHING;

INSERT INTO areas (city_id, name, legacy_location_id, lat, lng, requires_review)
SELECT c.city_id, l.name, l.location_id, l.lat, l.lng, false
FROM locations l
JOIN cities c ON c.name = l.name
JOIN regions r ON r.region_id = c.region_id
WHERE (l.name = 'Agadir' AND r.name = 'Souss-Massa')
   OR (l.name = 'Marrakech' AND r.name = 'Marrakech-Safi')
ON CONFLICT (legacy_location_id) DO UPDATE SET
  city_id = EXCLUDED.city_id,
  name = EXCLUDED.name,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  requires_review = false;

UPDATE listings l SET
  title = 'Atlantic View Villa in Agadir',
  description = 'A spacious Agadir villa with an Atlantic-facing terrace, bright rooms, and easy access to the coast.',
  location_id = destination.location_id,
  area_id = area.area_id,
  cover_image_url = 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&q=85'
FROM locations destination
JOIN areas area ON area.legacy_location_id = destination.location_id
WHERE l.title = 'Ocean View Family Villa' AND destination.name = 'Agadir';

UPDATE listings l SET
  title = 'Marrakech Garden Apartment',
  description = 'A calm Marrakech apartment with a sunny garden, modern kitchen, and room for the whole family.',
  location_id = destination.location_id,
  area_id = area.area_id,
  cover_image_url = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=85'
FROM locations destination
JOIN areas area ON area.legacy_location_id = destination.location_id
WHERE l.title = 'Sunny Garden Apartment' AND destination.name = 'Marrakech';

-- Consolidated from 017-property-discovery.sql

INSERT INTO property_types (name, slug, is_active)
VALUES ('Riad', 'riad', true)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, is_active = true;

ALTER TABLE listings ADD COLUMN IF NOT EXISTS bedrooms integer;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS bathrooms integer;

ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_bedrooms_check;
ALTER TABLE listings ADD CONSTRAINT listings_bedrooms_check
CHECK (bedrooms IS NULL OR bedrooms >= 0);
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_bathrooms_check;
ALTER TABLE listings ADD CONSTRAINT listings_bathrooms_check
CHECK (bathrooms IS NULL OR bathrooms >= 0);

UPDATE listings l SET property_type_id = pt.property_type_id
FROM property_types pt
WHERE pt.slug = 'riad' AND lower(l.title) ~ '\mriad\M';

UPDATE listings SET bedrooms = CASE
  WHEN guest_capacity IS NULL THEN NULL
  ELSE GREATEST(1, CEIL(guest_capacity::numeric / 2)::integer)
END
WHERE bedrooms IS NULL AND service_type = 'VACATION_RENTAL';

UPDATE listings SET bathrooms = CASE
  WHEN bedrooms IS NULL THEN NULL
  ELSE GREATEST(1, CEIL(bedrooms::numeric / 2)::integer)
END
WHERE bathrooms IS NULL AND service_type = 'VACATION_RENTAL';

CREATE INDEX IF NOT EXISTS listings_property_discovery_idx
ON listings(property_type_id, area_id, guest_capacity, bedrooms, bathrooms, base_price)
WHERE status = 'approved' AND is_active = true AND archived_at IS NULL;

-- Consolidated from 018-owner-dashboard-workflow.sql

ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_status_check;
ALTER TABLE listings ADD CONSTRAINT listings_status_check
CHECK (status IN ('approved', 'pending', 'rejected', 'changes_requested'));

ALTER TABLE listings ADD COLUMN IF NOT EXISTS beds integer;
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_beds_check;
ALTER TABLE listings ADD CONSTRAINT listings_beds_check CHECK (beds IS NULL OR beds >= 0);
UPDATE listings SET beds = GREATEST(1, COALESCE(bedrooms, 1))
WHERE beds IS NULL AND service_type = 'VACATION_RENTAL';

CREATE TABLE IF NOT EXISTS listing_availability_blocks (
  block_id bigserial PRIMARY KEY,
  listing_id integer NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  note text,
  created_by integer REFERENCES users(user_id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date > start_date)
);
CREATE INDEX IF NOT EXISTS listing_availability_blocks_dates_idx
ON listing_availability_blocks(listing_id, start_date, end_date);

CREATE INDEX IF NOT EXISTS listings_owner_dashboard_idx
ON listings(provider_id, status, updated_at DESC);

-- Consolidated from 019-immoove-cleanup.sql

-- Immoove housing-only cleanup. Historical categories and records remain for auditability.
INSERT INTO property_types (name, slug, is_active) VALUES
  ('Apartment', 'apartment', true),
  ('Studio', 'studio', true),
  ('Villa', 'villa', true)
ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, is_active=true;

UPDATE property_types SET is_active=false
WHERE slug NOT IN ('apartment','studio','villa');

UPDATE listings l SET property_type_id=studio.property_type_id
FROM property_types studio
WHERE studio.slug='studio' AND lower(l.title) ~ '\mstudio\M';

ALTER TABLE listings ADD COLUMN IF NOT EXISTS rental_term text NOT NULL DEFAULT 'short_term';
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_rental_term_check;
ALTER TABLE listings ADD CONSTRAINT listings_rental_term_check
CHECK (rental_term IN ('short_term','long_term','both'));

ALTER TABLE announcement_requests ADD COLUMN IF NOT EXISTS property_type_id integer
  REFERENCES property_types(property_type_id) ON DELETE RESTRICT;
ALTER TABLE announcement_requests ADD COLUMN IF NOT EXISTS rental_term text NOT NULL DEFAULT 'short_term';
ALTER TABLE announcement_requests DROP CONSTRAINT IF EXISTS announcement_requests_rental_term_check;
ALTER TABLE announcement_requests ADD CONSTRAINT announcement_requests_rental_term_check
CHECK (rental_term IN ('short_term','long_term','both'));

ALTER TABLE regions ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE areas ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

INSERT INTO cities (region_id, name)
SELECT region_id, 'Casablanca' FROM regions WHERE name='Casablanca-Settat'
ON CONFLICT (region_id,name) DO NOTHING;

INSERT INTO areas (city_id,name,requires_review)
SELECT city_id,'Casablanca',false FROM cities WHERE name='Casablanca'
  AND NOT EXISTS (SELECT 1 FROM areas WHERE city_id=cities.city_id AND name='Casablanca');

INSERT INTO areas (city_id,name,requires_review)
SELECT city_id,'Sidi Bouzid',false FROM cities WHERE name='El Jadida'
  AND NOT EXISTS (SELECT 1 FROM areas WHERE city_id=cities.city_id AND name='Sidi Bouzid');

INSERT INTO areas (city_id,name,requires_review)
SELECT city_id,'Marrakech',false FROM cities WHERE name='Marrakech'
  AND NOT EXISTS (SELECT 1 FROM areas WHERE city_id=cities.city_id AND name='Marrakech');

UPDATE cities SET is_active=false WHERE name='Agadir';
UPDATE areas SET is_active=false WHERE city_id IN (SELECT city_id FROM cities WHERE is_active=false);

CREATE INDEX IF NOT EXISTS listings_active_property_rental_idx
ON listings(property_type_id,rental_term,area_id,base_price)
WHERE status='approved' AND is_active=true AND archived_at IS NULL;

-- Consolidated from 020-location-deduplication.sql

-- Consolidate duplicate expandable location rows left by legacy free-text locations.
WITH canonical AS (
  SELECT city_id, lower(name) AS normalized_name, min(area_id) AS keep_id
  FROM areas
  GROUP BY city_id, lower(name)
), duplicates AS (
  SELECT a.area_id AS remove_id, c.keep_id
  FROM areas a
  JOIN canonical c ON c.city_id=a.city_id AND c.normalized_name=lower(a.name)
  WHERE a.area_id<>c.keep_id
)
UPDATE listings l SET area_id=d.keep_id
FROM duplicates d WHERE l.area_id=d.remove_id;

WITH canonical AS (
  SELECT city_id, lower(name) AS normalized_name, min(area_id) AS keep_id
  FROM areas
  GROUP BY city_id, lower(name)
)
DELETE FROM areas a USING canonical c
WHERE a.city_id=c.city_id AND lower(a.name)=c.normalized_name AND a.area_id<>c.keep_id;

UPDATE regions SET is_active=false WHERE name='Unassigned';
UPDATE cities SET is_active=false WHERE name='Unassigned';
UPDATE areas SET is_active=false WHERE city_id IN (SELECT city_id FROM cities WHERE is_active=false);

INSERT INTO areas (city_id,name,requires_review,is_active)
SELECT city_id,'El Jadida',false,true FROM cities WHERE name='El Jadida'
  AND NOT EXISTS (SELECT 1 FROM areas WHERE city_id=cities.city_id AND lower(name)='el jadida');

CREATE UNIQUE INDEX IF NOT EXISTS areas_city_normalized_name_idx
ON areas(city_id,lower(name));

