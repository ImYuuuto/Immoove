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