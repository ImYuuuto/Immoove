UPDATE listings l SET
  title = 'Ocean View Family Villa',
  description = 'A spacious coastal villa with a private terrace, bright rooms, and easy beach access.',
  location_id = legacy.location_id,
  area_id = legacy_area.area_id,
  cover_image_url = 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d'
FROM locations legacy
LEFT JOIN areas legacy_area ON legacy_area.legacy_location_id = legacy.location_id
WHERE l.title = 'Atlantic View Villa in Agadir' AND legacy.name = 'Sidi Bouzid';

UPDATE listings l SET
  title = 'Sunny Garden Apartment',
  description = 'A calm apartment with a sunny garden, modern kitchen, and space for the whole family.',
  location_id = legacy.location_id,
  area_id = legacy_area.area_id,
  cover_image_url = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267'
FROM locations legacy
LEFT JOIN areas legacy_area ON legacy_area.legacy_location_id = legacy.location_id
WHERE l.title = 'Marrakech Garden Apartment' AND legacy.name = 'Sidi Bouzid';

DELETE FROM areas WHERE name IN ('Agadir', 'Marrakech')
  AND NOT EXISTS (SELECT 1 FROM listings WHERE listings.area_id = areas.area_id);
DELETE FROM locations WHERE name IN ('Agadir', 'Marrakech')
  AND NOT EXISTS (SELECT 1 FROM listings WHERE listings.location_id = locations.location_id);
DELETE FROM cities WHERE name IN ('Agadir', 'Marrakech')
  AND NOT EXISTS (SELECT 1 FROM areas WHERE areas.city_id = cities.city_id);
DELETE FROM regions WHERE name IN ('Souss-Massa', 'Marrakech-Safi')
  AND NOT EXISTS (SELECT 1 FROM cities WHERE cities.region_id = regions.region_id);
UPDATE users SET
  password_hash = 'scrypt:a881f76777e66eaa1c2d13983377e483:131adc35d298e65fdd55dcb4d493b567ea5c20c0486634421175502aa8b6bd300494418e4678a587dcba3fa5315f19d755c612083cdaa0f20701bdbb9f85f58a'
WHERE email = 'amina@example.com';
