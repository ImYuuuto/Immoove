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
