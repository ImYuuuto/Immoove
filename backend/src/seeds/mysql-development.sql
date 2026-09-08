-- Repeatable development accounts for Immoove.
-- Catalogue, listing, owner, booking, and review data are intentionally omitted.
SET NAMES utf8mb4 COLLATE utf8mb4_0900_ai_ci;
SET time_zone = '+00:00';
START TRANSACTION;

INSERT INTO legal_documents
  (document_type, version, is_current, requires_reacceptance, effective_at)
VALUES ('terms', '1.0', TRUE, TRUE, '2026-01-01'),
       ('privacy', '1.0-draft', TRUE, FALSE, '2026-01-01')
ON DUPLICATE KEY UPDATE is_current=VALUES(is_current),
  requires_reacceptance=VALUES(requires_reacceptance), effective_at=VALUES(effective_at);

-- Development password hashes used by the retained local accounts.
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
  terms_accepted_at=VALUES(terms_accepted_at), terms_version=VALUES(terms_version),
  privacy_accepted_at=VALUES(privacy_accepted_at);

INSERT INTO user_legal_consents
  (user_id, document_type, document_version, accepted_at, accepted_language)
VALUES (1, 'terms', '1.0', '2026-01-01 12:00:00.000', 'en'),
       (2, 'terms', '1.0', '2026-01-01 12:00:00.000', 'fr'),
       (3, 'terms', '1.0', '2026-01-01 12:00:00.000', 'ar')
ON DUPLICATE KEY UPDATE accepted_at=VALUES(accepted_at),
  accepted_language=VALUES(accepted_language);

-- Small shared Moroccan sample dataset for team development and UI testing.
INSERT INTO users
  (user_id, first_name, last_name, email, phone, role, password_hash,
   avatar_url, account_status, terms_accepted_at, terms_version, privacy_accepted_at)
VALUES
  (4, 'Salma', 'El Idrissi', 'salma.elidrissi@example.test', '+212661234501', 'CLIENT',
   'scrypt:4d6f726f63636f496d6d6f6f766521:7b61ba8e55ba9f63bbd41d3c4cd572d8eb48240768611dc1b9760900b8ba051df4e5912b9bd21e96ec3c8b9a10b2508c30549d8b6089a11c4b59d86a213bf147',
   NULL, 'active', '2026-02-10 09:30:00.000', '1.0', '2026-02-10 09:30:00.000'),
  (5, 'Youssef', 'Amrani', 'youssef.amrani@example.test', '+212662345502', 'CLIENT',
   'scrypt:4d6f726f63636f496d6d6f6f766521:7b61ba8e55ba9f63bbd41d3c4cd572d8eb48240768611dc1b9760900b8ba051df4e5912b9bd21e96ec3c8b9a10b2508c30549d8b6089a11c4b59d86a213bf147',
   NULL, 'active', '2026-03-05 14:15:00.000', '1.0', '2026-03-05 14:15:00.000'),
  (6, 'Nadia', 'Benali', 'nadia.benali@example.test', '+212663456503', 'CLIENT',
   'scrypt:4d6f726f63636f496d6d6f6f766521:7b61ba8e55ba9f63bbd41d3c4cd572d8eb48240768611dc1b9760900b8ba051df4e5912b9bd21e96ec3c8b9a10b2508c30549d8b6089a11c4b59d86a213bf147',
   NULL, 'active', '2026-04-12 18:00:00.000', '1.0', '2026-04-12 18:00:00.000')
ON DUPLICATE KEY UPDATE first_name=VALUES(first_name), last_name=VALUES(last_name),
  phone=VALUES(phone), role=VALUES(role), account_status='active';

INSERT INTO user_legal_consents
  (user_id, document_type, document_version, accepted_at, accepted_language)
VALUES (4, 'terms', '1.0', '2026-02-10 09:30:00.000', 'fr'),
       (5, 'terms', '1.0', '2026-03-05 14:15:00.000', 'ar'),
       (6, 'terms', '1.0', '2026-04-12 18:00:00.000', 'fr')
ON DUPLICATE KEY UPDATE accepted_at=VALUES(accepted_at),
  accepted_language=VALUES(accepted_language);

INSERT INTO categories (category_id, name, slug) VALUES
  (1, 'Housing', 'housing')
ON DUPLICATE KEY UPDATE name=VALUES(name), slug=VALUES(slug);

INSERT INTO property_types (property_type_id, name, slug) VALUES
  (1, 'Apartment', 'apartment'),
  (2, 'Studio', 'studio'),
  (3, 'Villa', 'villa')
ON DUPLICATE KEY UPDATE name=VALUES(name), slug=VALUES(slug), is_active=TRUE;

INSERT INTO features (feature_id, name) VALUES
  (1, 'Wi-Fi'), (2, 'Air conditioning'), (3, 'Kitchen'),
  (4, 'Terrace'), (5, 'Sea view'), (6, 'Parking'), (7, 'Pool')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO locations (location_id, name, lat, lng) VALUES
  (1, 'Casablanca', 33.5731000, -7.5898000),
  (2, 'Marrakech', 31.6295000, -7.9811000),
  (3, 'El Jadida', 33.2316000, -8.5007000)
ON DUPLICATE KEY UPDATE name=VALUES(name), lat=VALUES(lat), lng=VALUES(lng);

INSERT INTO regions (region_id, name) VALUES
  (1, 'Casablanca-Settat'), (2, 'Marrakech-Safi')
ON DUPLICATE KEY UPDATE name=VALUES(name), is_active=TRUE;

INSERT INTO cities (city_id, region_id, name) VALUES
  (1, 1, 'Casablanca'), (2, 2, 'Marrakech'), (3, 1, 'El Jadida')
ON DUPLICATE KEY UPDATE region_id=VALUES(region_id), name=VALUES(name), is_active=TRUE;

INSERT INTO areas (area_id, city_id, name, legacy_location_id, lat, lng) VALUES
  (1, 1, 'Maarif', 1, 33.5860000, -7.6328000),
  (2, 2, 'Médina', 2, 31.6290000, -7.9890000),
  (3, 3, 'Sidi Bouzid', 3, 33.2314000, -8.5562000)
ON DUPLICATE KEY UPDATE city_id=VALUES(city_id), name=VALUES(name),
  lat=VALUES(lat), lng=VALUES(lng), is_active=TRUE;

INSERT INTO property_owners
  (owner_id, first_name, last_name, national_id_code, phone, email)
VALUES
  (1, 'Khalid', 'Berrada', 'DEV-CIN-001', '+212664111101', 'khalid.berrada@example.test'),
  (2, 'Laila', 'Tazi', 'DEV-CIN-002', '+212665222202', 'laila.tazi@example.test'),
  (3, 'Omar', 'Alaoui', 'DEV-CIN-003', '+212666333303', 'omar.alaoui@example.test')
ON DUPLICATE KEY UPDATE first_name=VALUES(first_name), last_name=VALUES(last_name),
  phone=VALUES(phone), email=VALUES(email);

INSERT INTO listings
  (listing_id, provider_id, owner_id, category_id, location_id, area_id,
   property_type_id, title, description, base_price, pricing_unit,
   contact_name, contact_phone, contact_email, status, is_active,
   cover_image_url, service_type, guest_capacity, is_featured,
   submitted_at, reviewed_at, reviewed_by, bedrooms, beds, bathrooms,
   rental_term, contract_number, location_text, latitude, longitude)
VALUES
  (1, 1, 1, 1, 1, 1, 1, 'Appartement lumineux à Maarif',
   'Appartement calme et bien équipé, proche des cafés et commerces de Maarif.',
   720.00, 'night', 'Khalid Berrada', '+212664111101', 'khalid.berrada@example.test',
   'approved', TRUE, '/uploads/site/samples/casablanca-apartment.png', 'VACATION_RENTAL', 4, TRUE,
   '2026-05-01 10:00:00.000', '2026-05-01 12:00:00.000', 1, 2, 3, 1,
   'both', 'DEV-SAMPLE-001', 'Maarif, Casablanca', 33.5860000, -7.6328000),
  (2, 1, 2, 1, 2, 2, 3, 'Maison avec patio dans la Médina',
   'Maison marocaine rénovée avec patio arboré, idéale pour un séjour en famille.',
   1100.00, 'night', 'Laila Tazi', '+212665222202', 'laila.tazi@example.test',
   'approved', TRUE, '/uploads/site/samples/marrakech-riad.png', 'VACATION_RENTAL', 6, TRUE,
   '2026-05-08 09:00:00.000', '2026-05-08 11:00:00.000', 1, 3, 4, 2,
   'short_term', 'DEV-SAMPLE-002', 'Médina, Marrakech', 31.6290000, -7.9890000),
  (3, 1, 3, 1, 3, 3, 2, 'Studio avec terrasse face à l’océan',
   'Studio confortable à Sidi Bouzid avec terrasse, vue dégagée et accès rapide à la plage.',
   480.00, 'night', 'Omar Alaoui', '+212666333303', 'omar.alaoui@example.test',
   'approved', TRUE, '/uploads/site/samples/el-jadida-terrace.png', 'VACATION_RENTAL', 2, FALSE,
   '2026-05-15 15:00:00.000', '2026-05-15 17:00:00.000', 1, 1, 1, 1,
   'short_term', 'DEV-SAMPLE-003', 'Sidi Bouzid, El Jadida', 33.2314000, -8.5562000)
ON DUPLICATE KEY UPDATE title=VALUES(title), description=VALUES(description),
  base_price=VALUES(base_price), cover_image_url=VALUES(cover_image_url),
  status=VALUES(status), is_active=VALUES(is_active), updated_at=CURRENT_TIMESTAMP(3);

INSERT INTO listing_images (id, listing_id, url, sort_order) VALUES
  (1, 1, '/uploads/site/samples/casablanca-apartment.png', 0),
  (2, 2, '/uploads/site/samples/marrakech-riad.png', 0),
  (3, 3, '/uploads/site/samples/el-jadida-terrace.png', 0)
ON DUPLICATE KEY UPDATE listing_id=VALUES(listing_id), url=VALUES(url), sort_order=VALUES(sort_order);

INSERT IGNORE INTO listing_features (listing_id, feature_id) VALUES
  (1,1),(1,2),(1,3),(1,6),
  (2,1),(2,2),(2,3),(2,4),(2,7),
  (3,1),(3,3),(3,4),(3,5);
INSERT IGNORE INTO listing_categories (listing_id, category_id) VALUES (1,1),(2,1),(3,1);

INSERT INTO bookings
  (booking_id, listing_id, user_id, start_date, end_date, total,
   contact_first_name, contact_last_name, contact_email, contact_phone,
   status, payment_status, currency, processed_by, processed_at)
VALUES
  (1, 1, 4, '2026-06-12 14:00:00.000', '2026-06-15 11:00:00.000', 2160.00,
   'Salma', 'El Idrissi', 'salma.elidrissi@example.test', '+212661234501',
   'completed', 'paid', 'MAD', 1, '2026-06-10 10:00:00.000'),
  (2, 2, 5, '2026-07-03 14:00:00.000', '2026-07-06 11:00:00.000', 3300.00,
   'Youssef', 'Amrani', 'youssef.amrani@example.test', '+212662345502',
   'completed', 'paid', 'MAD', 1, '2026-07-01 09:30:00.000'),
  (3, 3, 6, '2026-08-15 14:00:00.000', '2026-08-17 11:00:00.000', 960.00,
   'Nadia', 'Benali', 'nadia.benali@example.test', '+212663456503',
   'completed', 'paid', 'MAD', 1, '2026-08-12 16:00:00.000'),
  (4, 1, 5, '2026-10-18 14:00:00.000', '2026-10-21 11:00:00.000', 2160.00,
   'Youssef', 'Amrani', 'youssef.amrani@example.test', '+212662345502',
   'confirmed', 'paid', 'MAD', 1, '2026-09-02 11:00:00.000')
ON DUPLICATE KEY UPDATE status=VALUES(status), payment_status=VALUES(payment_status),
  total=VALUES(total), processed_by=VALUES(processed_by), processed_at=VALUES(processed_at);

INSERT INTO reviews (review_id, booking_id, rating, comment, created_at) VALUES
  (1, 1, 5, 'Appartement très propre et quartier pratique. Khalid a été disponible dès notre arrivée.', '2026-06-16 10:20:00.000'),
  (2, 2, 4, 'Le patio est magnifique et la maison très agréable. Un peu de bruit le matin, mais excellent séjour.', '2026-07-07 18:45:00.000'),
  (3, 3, 5, 'Vue superbe sur l’océan et plage accessible à pied. Je reviendrai avec plaisir.', '2026-08-18 12:10:00.000')
ON DUPLICATE KEY UPDATE rating=VALUES(rating), comment=VALUES(comment),
  created_at=VALUES(created_at);

INSERT IGNORE INTO favorites (user_id, listing_id) VALUES
  (4,2),(4,3),(5,1),(6,1),(6,2);

COMMIT;
