-- Repeatable MySQL development data for Immoove.
SET NAMES utf8mb4 COLLATE utf8mb4_0900_ai_ci;
SET time_zone = '+00:00';
START TRANSACTION;

INSERT INTO categories (category_id, name, slug) VALUES
  (1, 'Housing', 'housing'), (2, 'Services', 'services'),
  (3, 'Hobbies and Activities', 'hobbies-and-activities'),
  (4, 'Renting Cars', 'renting-cars'), (5, 'Homes', 'homes'),
  (6, 'Experiences', 'experiences')
ON DUPLICATE KEY UPDATE name=VALUES(name), slug=VALUES(slug);

INSERT INTO property_types (property_type_id, name, slug) VALUES
  (1, 'Apartment', 'apartment'), (2, 'Studio', 'studio'),
  (3, 'Villa', 'villa'), (4, 'House', 'house'),
  (5, 'Riad', 'riad'), (6, 'Room', 'room'),
  (7, 'Guest house', 'guest-house'), (8, 'Other', 'other')
ON DUPLICATE KEY UPDATE name=VALUES(name), slug=VALUES(slug), is_active=TRUE;

INSERT INTO features (feature_id, name) VALUES
  (1, 'Wi-Fi'), (2, 'Pool'), (3, 'Sea view'), (4, 'Kitchen'),
  (5, 'Parking'), (6, 'Terrace'), (7, 'Air conditioning'),
  (8, 'Automatic transmission'), (9, 'Equipment included'),
  (10, 'Family friendly'), (11, 'Outdoor space')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO locations (location_id, name, lat, lng) VALUES
  (1, 'Sidi Bouzid', 33.2314000, -8.5562000),
  (2, 'El Jadida', 33.2316000, -8.5007000),
  (3, 'Casablanca', 33.5731000, -7.5898000),
  (4, 'Marrakech', 31.6295000, -7.9811000)
ON DUPLICATE KEY UPDATE name=VALUES(name), lat=VALUES(lat), lng=VALUES(lng);

INSERT INTO regions (region_id, name) VALUES
  (1, 'Casablanca-Settat'), (2, 'Marrakech-Safi')
ON DUPLICATE KEY UPDATE name=VALUES(name), is_active=TRUE;

INSERT INTO cities (city_id, region_id, name) VALUES
  (1, 1, 'El Jadida'), (2, 1, 'Casablanca'), (3, 2, 'Marrakech')
ON DUPLICATE KEY UPDATE region_id=VALUES(region_id), name=VALUES(name), is_active=TRUE;

INSERT INTO areas (area_id, city_id, name, legacy_location_id, lat, lng) VALUES
  (1, 1, 'Sidi Bouzid', 1, 33.2314000, -8.5562000),
  (2, 1, 'El Jadida Centre', 2, 33.2316000, -8.5007000),
  (3, 2, 'Casablanca Centre', 3, 33.5731000, -7.5898000),
  (4, 3, 'Marrakech Centre', 4, 31.6295000, -7.9811000)
ON DUPLICATE KEY UPDATE name=VALUES(name), lat=VALUES(lat), lng=VALUES(lng), is_active=TRUE;

INSERT INTO legal_documents
  (document_type, version, is_current, requires_reacceptance, effective_at)
VALUES ('terms', '1.0', TRUE, TRUE, '2026-01-01'),
       ('privacy', '1.0-draft', TRUE, FALSE, '2026-01-01')
ON DUPLICATE KEY UPDATE is_current=VALUES(is_current),
  requires_reacceptance=VALUES(requires_reacceptance), effective_at=VALUES(effective_at);

-- Development password hash used by the existing local demo accounts.
INSERT INTO users
  (user_id, first_name, last_name, email, role, password_hash,
   account_status, terms_accepted_at, terms_version, privacy_accepted_at)
VALUES
  (1, 'Immoove', 'Admin', 'admin@immoove.local', 'ADMIN',
   'scrypt:e4c212caff44a755622eb9529ca29be6:132119512018a87ddc509db5677926022b3c87dfb02038ac42fbd723e122fa48460be4788852dd889b6211c06f15bb798df9aa2ad39590a1e96faa95e8686e7d',
   'active', '2026-01-01 12:00:00.000', '1.0', '2026-01-01 12:00:00.000'),
  (2, 'Amina', 'Bouzid', 'amina@example.com', 'CLIENT',
   'scrypt:4d6f726f63636f496d6d6f6f766521:7b61ba8e55ba9f63bbd41d3c4cd572d8eb48240768611dc1b9760900b8ba051df4e5912b9bd21e96ec3c8b9a10b2508c30549d8b6089a11c4b59d86a213bf147',
   'active', '2026-01-01 12:00:00.000', '1.0', '2026-01-01 12:00:00.000'),
  (3, 'Karim', 'Salah', 'karim@example.com', 'CLIENT',
   'scrypt:4d6f726f63636f496d6d6f6f766521:7b61ba8e55ba9f63bbd41d3c4cd572d8eb48240768611dc1b9760900b8ba051df4e5912b9bd21e96ec3c8b9a10b2508c30549d8b6089a11c4b59d86a213bf147',
   'active', '2026-01-01 12:00:00.000', '1.0', '2026-01-01 12:00:00.000')
ON DUPLICATE KEY UPDATE first_name=VALUES(first_name), last_name=VALUES(last_name),
  role=VALUES(role), password_hash=VALUES(password_hash), account_status='active',
  terms_accepted_at=VALUES(terms_accepted_at), terms_version=VALUES(terms_version);

INSERT INTO user_legal_consents
  (user_id, document_type, document_version, accepted_at, accepted_language)
VALUES (1, 'terms', '1.0', '2026-01-01 12:00:00.000', 'en'),
       (2, 'terms', '1.0', '2026-01-01 12:00:00.000', 'fr'),
       (3, 'terms', '1.0', '2026-01-01 12:00:00.000', 'ar')
ON DUPLICATE KEY UPDATE accepted_language=VALUES(accepted_language);

INSERT INTO property_owners
  (owner_id, first_name, last_name, national_id_code, phone, email, photo_url)
VALUES
  (1, 'Nadia', 'El Mansouri', 'DEV-OWNER-001', '+212600000001', 'nadia@example.com', '/uploads/site/categories/stays.jpg'),
  (2, 'Omar', 'Bennani', 'DEV-OWNER-002', '+212600000002', 'omar@example.com', '/uploads/site/categories/beach.jpg')
ON DUPLICATE KEY UPDATE first_name=VALUES(first_name), last_name=VALUES(last_name),
  phone=VALUES(phone), email=VALUES(email), photo_url=VALUES(photo_url);

INSERT INTO listings
  (listing_id, provider_id, owner_id, category_id, location_id, area_id,
   property_type_id, title, description, base_price, pricing_unit,
   contact_name, contact_phone, contact_email, status, is_active,
   cover_image_url, service_type, guest_capacity, is_featured,
   submitted_at, reviewed_at, reviewed_by, bedrooms, beds, bathrooms,
   rental_term, contract_number, location_text, latitude, longitude)
VALUES
  (1, 1, 1, 1, 1, 1, 1, 'Atlantic Beach Apartment · Sidi Bouzid',
   'Bright coastal apartment close to the beach.', 520.00, 'night', 'Nadia El Mansouri', '+212600000001', 'nadia@example.com',
   'approved', TRUE, '/uploads/site/listings/maison-bleue.jpg', 'VACATION_RENTAL', 4, TRUE,
   '2026-01-02 10:00:00.000', '2026-01-02 12:00:00.000', 1, 2, 3, 1, 'short_term', 'DEV-001', 'Sidi Bouzid', 33.2314000, -8.5562000),
  (2, 1, 1, 1, 1, 1, 2, 'Coastal Light Studio · Sidi Bouzid',
   'Compact studio with sea light and modern amenities.', 330.00, 'night', 'Nadia El Mansouri', '+212600000001', 'nadia@example.com',
   'approved', TRUE, '/uploads/site/listings/dar-el-bahri.jpg', 'VACATION_RENTAL', 2, TRUE,
   '2026-01-03 10:00:00.000', '2026-01-03 12:00:00.000', 1, 1, 1, 1, 'both', 'DEV-002', 'Sidi Bouzid', 33.2320000, -8.5555000),
  (3, 1, 2, 1, 1, 1, 3, 'Ocean Garden Villa · Sidi Bouzid',
   'Family villa with a private garden, pool, and sea view.', 1380.00, 'night', 'Omar Bennani', '+212600000002', 'omar@example.com',
   'approved', TRUE, '/uploads/site/listings/villa-des-dunes.jpg', 'VACATION_RENTAL', 8, TRUE,
   '2026-01-04 10:00:00.000', '2026-01-04 12:00:00.000', 1, 4, 6, 3, 'short_term', 'DEV-003', 'Sidi Bouzid', 33.2305000, -8.5570000),
  (4, 1, 2, 1, 2, 2, 1, 'El Jadida City Apartment',
   'Central apartment for short and long stays.', 610.00, 'night', 'Omar Bennani', '+212600000002', 'omar@example.com',
   'approved', TRUE, '/uploads/site/listings/maison-bleue.jpg', 'VACATION_RENTAL', 5, FALSE,
   '2026-01-05 10:00:00.000', '2026-01-05 12:00:00.000', 1, 3, 4, 2, 'both', 'DEV-004', 'El Jadida Centre', 33.2316000, -8.5007000),
  (5, 1, NULL, 1, 3, 3, 2, 'Casablanca Design Studio',
   'Modern studio in central Casablanca.', 470.00, 'night', 'Immoove', '+212600000000', 'admin@immoove.local',
   'approved', TRUE, '/uploads/site/listings/dar-el-bahri.jpg', 'VACATION_RENTAL', 2, FALSE,
   '2026-01-06 10:00:00.000', '2026-01-06 12:00:00.000', 1, 1, 1, 1, 'long_term', NULL, 'Casablanca Centre', 33.5731000, -7.5898000),
  (6, 1, NULL, 1, 4, 4, 5, 'Marrakech Courtyard Riad',
   'Traditional courtyard stay with modern comfort.', 920.00, 'night', 'Immoove', '+212600000000', 'admin@immoove.local',
   'approved', TRUE, '/uploads/site/listings/villa-des-dunes.jpg', 'VACATION_RENTAL', 6, FALSE,
   '2026-01-07 10:00:00.000', '2026-01-07 12:00:00.000', 1, 3, 4, 2, 'short_term', NULL, 'Marrakech Centre', 31.6295000, -7.9811000)
ON DUPLICATE KEY UPDATE title=VALUES(title), description=VALUES(description),
  base_price=VALUES(base_price), cover_image_url=VALUES(cover_image_url),
  status=VALUES(status), is_active=VALUES(is_active), updated_at=CURRENT_TIMESTAMP(3);

INSERT INTO listing_images (id, listing_id, url, sort_order) VALUES
  (1,1,'/uploads/site/listings/maison-bleue.jpg',0), (2,1,'/uploads/site/listings/dar-el-bahri.jpg',1),
  (3,1,'/uploads/site/listings/villa-des-dunes.jpg',2), (4,2,'/uploads/site/listings/dar-el-bahri.jpg',0),
  (5,2,'/uploads/site/listings/maison-bleue.jpg',1), (6,3,'/uploads/site/listings/villa-des-dunes.jpg',0),
  (7,3,'/uploads/site/listings/maison-bleue.jpg',1), (8,4,'/uploads/site/listings/maison-bleue.jpg',0),
  (9,5,'/uploads/site/listings/dar-el-bahri.jpg',0), (10,6,'/uploads/site/listings/villa-des-dunes.jpg',0)
ON DUPLICATE KEY UPDATE listing_id=VALUES(listing_id), url=VALUES(url), sort_order=VALUES(sort_order);

INSERT IGNORE INTO listing_features (listing_id, feature_id) VALUES
  (1,1),(1,3),(1,4),(1,6),(2,1),(2,3),(2,7),
  (3,1),(3,2),(3,3),(3,5),(3,10),(3,11),(4,1),(4,4),(4,5),
  (5,1),(5,7),(6,1),(6,4),(6,6);
INSERT IGNORE INTO listing_categories (listing_id, category_id)
  SELECT listing_id, category_id FROM listings WHERE listing_id BETWEEN 1 AND 6;

INSERT INTO bookings
  (booking_id, listing_id, user_id, start_date, end_date, total,
   contact_first_name, contact_last_name, contact_email, contact_phone,
   status, payment_status, currency)
VALUES
  (1,1,2,'2026-06-01 12:00:00.000','2026-06-04 12:00:00.000',1560.00,'Amina','Bouzid','amina@example.com','+212611111111','completed','paid','MAD'),
  (2,2,3,'2026-10-10 12:00:00.000','2026-10-13 12:00:00.000',990.00,'Karim','Salah','karim@example.com','+212622222222','confirmed','paid','MAD'),
  (3,3,2,'2026-11-05 12:00:00.000','2026-11-07 12:00:00.000',2760.00,'Amina','Bouzid','amina@example.com','+212611111111','pending','unpaid','MAD')
ON DUPLICATE KEY UPDATE status=VALUES(status), payment_status=VALUES(payment_status), total=VALUES(total);

INSERT INTO reviews (review_id, booking_id, rating, comment) VALUES
  (1,1,5,'Excellent location and a very comfortable stay.')
ON DUPLICATE KEY UPDATE rating=VALUES(rating), comment=VALUES(comment);

INSERT INTO listing_availability_blocks
  (block_id, listing_id, start_date, end_date, note, created_by)
VALUES (1,3,'2026-12-01 12:00:00.000','2026-12-04 12:00:00.000','Owner maintenance',1)
ON DUPLICATE KEY UPDATE start_date=VALUES(start_date), end_date=VALUES(end_date), note=VALUES(note);

COMMIT;
