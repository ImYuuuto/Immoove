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
    listing_id int REFERENCES listings (listing_id),
    user_id int REFERENCES users (user_id),
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
    actor_id int REFERENCES users (user_id),
    action text,
    entity_type text,
    entity_id int,
    reason text,
    created_at timestamptz DEFAULT now()
);

