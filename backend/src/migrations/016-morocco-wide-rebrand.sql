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
