-- Correct legacy Tunisian coordinates for Sidi Bouzid to the coastal locality
-- near El Jadida, Morocco. Existing listing offsets are kept close to the area.
UPDATE locations
SET lat = 33.2314, lng = -8.5562
WHERE lower(name) = 'sidi bouzid';

UPDATE areas a
SET lat = 33.2314, lng = -8.5562
FROM cities c
WHERE a.city_id = c.city_id
  AND lower(c.name) = 'sidi bouzid';

UPDATE listings l
SET latitude = 33.2314 + ((l.listing_id % 5) - 2) * 0.0012,
    longitude = -8.5562 + ((l.listing_id % 7) - 3) * 0.0011,
    map_url = 'https://www.google.com/maps?q=' ||
      (33.2314 + ((l.listing_id % 5) - 2) * 0.0012)::text || ',' ||
      (-8.5562 + ((l.listing_id % 7) - 3) * 0.0011)::text
FROM areas a
JOIN cities c ON c.city_id = a.city_id
WHERE l.area_id = a.area_id
  AND lower(c.name) = 'sidi bouzid';
