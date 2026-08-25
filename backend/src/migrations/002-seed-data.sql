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
