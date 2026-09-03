-- Bring the demo catalogue in line with properties created through the current admin form.
-- This migration only touches records marked with the demo-listings contact address.

WITH sample_owners(first_name,last_name,national_id_code,phone,email,photo_url) AS (
  VALUES
    ('Amine','Berrada','DEMO-CIN-1001','+212661100101','amine.owner@demo.immoove.local','https://i.pravatar.cc/512?img=12'),
    ('Leila','Amrani','DEMO-CIN-1002','+212661100102','leila.owner@demo.immoove.local','https://i.pravatar.cc/512?img=47'),
    ('Rachid','Mansouri','DEMO-CIN-1003','+212661100103','rachid.owner@demo.immoove.local','https://i.pravatar.cc/512?img=68'),
    ('Sara','Alaoui','DEMO-CIN-1004','+212661100104','sara.owner@demo.immoove.local','https://i.pravatar.cc/512?img=32'),
    ('Yassine','Tazi','DEMO-CIN-1005','+212661100105','yassine.owner@demo.immoove.local','https://i.pravatar.cc/512?img=11'),
    ('Nora','Idrissi','DEMO-CIN-1006','+212661100106','nora.owner@demo.immoove.local','https://i.pravatar.cc/512?img=45'),
    ('Mehdi','Fassi','DEMO-CIN-1007','+212661100107','mehdi.owner@demo.immoove.local','https://i.pravatar.cc/512?img=53'),
    ('Imane','Chraibi','DEMO-CIN-1008','+212661100108','imane.owner@demo.immoove.local','https://i.pravatar.cc/512?img=25')
)
INSERT INTO property_owners(first_name,last_name,national_id_code,phone,email,photo_url)
SELECT * FROM sample_owners
ON CONFLICT(national_id_code) DO UPDATE SET
  first_name=EXCLUDED.first_name,last_name=EXCLUDED.last_name,phone=EXCLUDED.phone,
  email=EXCLUDED.email,photo_url=EXCLUDED.photo_url,updated_at=now();

WITH numbered_listings AS (
  SELECT l.listing_id, row_number() OVER (ORDER BY l.listing_id) AS number,
         c.name AS city_name, a.lat AS area_lat, a.lng AS area_lng
  FROM listings l
  LEFT JOIN areas a ON a.area_id=l.area_id
  LEFT JOIN cities c ON c.city_id=a.city_id
  WHERE l.contact_email='demo-listings@immoove.local'
), numbered_owners AS (
  SELECT owner_id,first_name,last_name,phone,email,
         row_number() OVER (ORDER BY national_id_code) AS number
  FROM property_owners WHERE national_id_code LIKE 'DEMO-CIN-%'
)
UPDATE listings l SET
  owner_id=o.owner_id,
  contact_name=o.first_name || ' ' || o.last_name,
  contact_phone=o.phone,
  contact_email=o.email,
  contract_number='IMV-DEMO-' || to_char(n.listing_id,'FM00000'),
  contract_document_url='/uploads/site/categories/stays.jpg',
  location_text=COALESCE(n.city_name,'Morocco') || ' · central location near local attractions',
  map_url='https://www.google.com/maps?q=' ||
    (COALESCE(n.area_lat, CASE n.city_name WHEN 'Marrakech' THEN 31.6295 WHEN 'Casablanca' THEN 33.5731 WHEN 'El Jadida' THEN 33.2316 WHEN 'Sidi Bouzid' THEN 33.2314 ELSE 31.7917 END) + ((n.number % 5)-2)*0.0012)::text || ',' ||
    (COALESCE(n.area_lng, CASE n.city_name WHEN 'Marrakech' THEN -7.9811 WHEN 'Casablanca' THEN -7.5898 WHEN 'El Jadida' THEN -8.5007 WHEN 'Sidi Bouzid' THEN -8.5562 ELSE -7.0926 END) + ((n.number % 7)-3)*0.0011)::text,
  latitude=COALESCE(n.area_lat, CASE n.city_name WHEN 'Marrakech' THEN 31.6295 WHEN 'Casablanca' THEN 33.5731 WHEN 'El Jadida' THEN 33.2316 WHEN 'Sidi Bouzid' THEN 33.2314 ELSE 31.7917 END) + ((n.number % 5)-2)*0.0012,
  longitude=COALESCE(n.area_lng, CASE n.city_name WHEN 'Marrakech' THEN -7.9811 WHEN 'Casablanca' THEN -7.5898 WHEN 'El Jadida' THEN -8.5007 WHEN 'Sidi Bouzid' THEN -8.5562 ELSE -7.0926 END) + ((n.number % 7)-3)*0.0011,
  description='Welcome to ' || l.title || E'.\n\nThis verified home combines Moroccan character with practical comfort. Guests enjoy bright living spaces, a fully equipped kitchen, reliable Wi-Fi, comfortable bedrooms, and a private outdoor area. The location is convenient for restaurants, shops, local attractions, and relaxed days exploring the city.\n\nThe property is professionally prepared before each arrival and the Immoove team remains available throughout the stay.'
FROM numbered_listings n
JOIN numbered_owners o ON o.number=((n.number-1)%8)+1
WHERE l.listing_id=n.listing_id;

DELETE FROM listing_images li
USING listings l
WHERE li.listing_id=l.listing_id AND l.owner_id IN
  (SELECT owner_id FROM property_owners WHERE national_id_code LIKE 'DEMO-CIN-%');

INSERT INTO listing_images(listing_id,url,sort_order)
SELECT l.listing_id, gallery.url, gallery.sort_order
FROM listings l
CROSS JOIN (VALUES
  ('/uploads/site/listings/maison-bleue.jpg',0),
  ('/uploads/site/listings/dar-el-bahri.jpg',1),
  ('/uploads/site/listings/villa-des-dunes.jpg',2)
) AS gallery(url,sort_order)
WHERE l.owner_id IN (SELECT owner_id FROM property_owners WHERE national_id_code LIKE 'DEMO-CIN-%');

UPDATE listings l SET cover_image_url=li.url
FROM listing_images li
WHERE li.listing_id=l.listing_id AND li.sort_order=0
  AND l.owner_id IN (SELECT owner_id FROM property_owners WHERE national_id_code LIKE 'DEMO-CIN-%');

-- Demonstrate the manual confirmation workflow in both the client profile and admin queue.
WITH future_demo AS (
  SELECT b.booking_id,row_number() OVER (ORDER BY b.booking_id) AS number
  FROM bookings b JOIN users u ON u.user_id=b.user_id
  WHERE u.email LIKE '%@demo.immoove.local' AND b.start_date>now()
)
UPDATE bookings b SET status=CASE WHEN d.number%3=0 THEN 'confirmed' WHEN d.number%3=1 THEN 'pending' ELSE 'processing' END,
  payment_status=CASE WHEN d.number%3=0 THEN 'paid' ELSE 'unpaid' END
FROM future_demo d WHERE b.booking_id=d.booking_id;
