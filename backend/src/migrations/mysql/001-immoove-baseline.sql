-- Clean MySQL 8.4 baseline for Immoove.
-- Structural schema only. Development data belongs in src/seeds/mysql-development.sql.

SET NAMES utf8mb4 COLLATE utf8mb4_0900_ai_ci;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS schema_migrations (
  filename VARCHAR(255) NOT NULL,
  checksum CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (filename)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS users (
  user_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(320) NOT NULL,
  phone VARCHAR(50),
  role VARCHAR(20) NOT NULL DEFAULT 'CLIENT',
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  password_hash VARCHAR(255),
  session_version INT UNSIGNED NOT NULL DEFAULT 0,
  avatar_url VARCHAR(2048),
  account_status VARCHAR(20) NOT NULL DEFAULT 'active',
  terms_accepted_at DATETIME(3),
  terms_version VARCHAR(64),
  privacy_accepted_at DATETIME(3),
  PRIMARY KEY (user_id),
  UNIQUE KEY users_email_key (email),
  KEY users_dashboard_idx (account_status, created_at DESC),
  CONSTRAINT users_role_check CHECK (role IN ('CLIENT', 'ADMIN')),
  CONSTRAINT users_account_status_check CHECK (account_status IN ('active', 'suspended')),
  CONSTRAINT users_terms_acceptance_check CHECK (
    (terms_accepted_at IS NULL AND terms_version IS NULL)
    OR (terms_accepted_at IS NOT NULL AND NULLIF(TRIM(terms_version), '') IS NOT NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS categories (
  category_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(120) NOT NULL,
  PRIMARY KEY (category_id),
  UNIQUE KEY categories_slug_key (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS locations (
  location_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(300) NOT NULL,
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  PRIMARY KEY (location_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS property_types (
  property_type_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(120) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (property_type_id),
  UNIQUE KEY property_types_name_key (name),
  UNIQUE KEY property_types_slug_key (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS regions (
  region_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (region_id),
  UNIQUE KEY regions_name_key (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS cities (
  city_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  region_id INT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (city_id),
  UNIQUE KEY cities_region_id_name_key (region_id, name),
  KEY cities_region_idx (region_id),
  CONSTRAINT cities_region_id_fkey FOREIGN KEY (region_id)
    REFERENCES regions (region_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS areas (
  area_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  city_id INT UNSIGNED NOT NULL,
  name VARCHAR(160) NOT NULL,
  legacy_location_id INT UNSIGNED,
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  requires_review BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (area_id),
  UNIQUE KEY areas_city_normalized_name_idx (city_id, name),
  UNIQUE KEY areas_legacy_location_id_key (legacy_location_id),
  KEY areas_city_idx (city_id),
  CONSTRAINT areas_city_id_fkey FOREIGN KEY (city_id)
    REFERENCES cities (city_id) ON DELETE RESTRICT,
  CONSTRAINT areas_legacy_location_id_fkey FOREIGN KEY (legacy_location_id)
    REFERENCES locations (location_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS property_owners (
  owner_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  national_id_code VARCHAR(50) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(320),
  photo_url VARCHAR(2048),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (owner_id),
  UNIQUE KEY property_owners_national_id_code_key (national_id_code),
  KEY property_owners_name_idx (first_name, last_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS listings (
  listing_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  provider_id INT UNSIGNED,
  category_id INT UNSIGNED,
  location_id INT UNSIGNED,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  base_price DECIMAL(12,2) NOT NULL,
  pricing_unit VARCHAR(30),
  contact_name VARCHAR(150),
  contact_phone VARCHAR(50),
  contact_email VARCHAR(320),
  status VARCHAR(32) NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  cover_image_url VARCHAR(2048),
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  service_type VARCHAR(32),
  guest_capacity INT UNSIGNED,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_at DATETIME(3),
  reviewed_at DATETIME(3),
  reviewed_by INT UNSIGNED,
  rejection_reason TEXT,
  map_url VARCHAR(2048),
  archived_at DATETIME(3),
  archive_reason TEXT,
  property_type_id INT UNSIGNED,
  area_id INT UNSIGNED,
  bedrooms INT UNSIGNED,
  bathrooms INT UNSIGNED,
  beds INT UNSIGNED,
  rental_term VARCHAR(20) NOT NULL DEFAULT 'short_term',
  owner_id INT UNSIGNED,
  contract_number VARCHAR(100),
  contract_document_url VARCHAR(2048),
  location_text VARCHAR(500),
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  PRIMARY KEY (listing_id),
  UNIQUE KEY listings_contract_number_unique_idx (contract_number),
  KEY listings_area_idx (area_id),
  KEY listings_property_type_idx (property_type_id),
  KEY listings_provider_created_idx (provider_id, created_at DESC),
  KEY listings_owner_idx (owner_id, created_at DESC),
  KEY listings_owner_dashboard_idx (provider_id, status, updated_at DESC),
  KEY listings_public_created_idx (status, is_active, archived_at, created_at DESC),
  KEY listings_public_featured_idx (status, is_active, is_featured, archived_at, created_at DESC),
  KEY listings_public_category_created_idx (status, is_active, category_id, created_at DESC),
  KEY listings_public_location_created_idx (status, is_active, location_id, created_at DESC),
  KEY listings_public_price_idx (status, is_active, base_price),
  KEY listings_public_capacity_idx (status, is_active, guest_capacity),
  KEY listings_search_idx (status, is_active, service_type, base_price, guest_capacity),
  KEY listings_property_discovery_idx (
    status, is_active, archived_at, property_type_id, area_id,
    guest_capacity, bedrooms, bathrooms, base_price
  ),
  KEY listings_active_property_rental_idx (
    status, is_active, archived_at, property_type_id, rental_term, area_id, base_price
  ),
  CONSTRAINT listings_provider_id_fkey FOREIGN KEY (provider_id)
    REFERENCES users (user_id) ON DELETE CASCADE,
  CONSTRAINT listings_category_id_fkey FOREIGN KEY (category_id)
    REFERENCES categories (category_id),
  CONSTRAINT listings_location_id_fkey FOREIGN KEY (location_id)
    REFERENCES locations (location_id),
  CONSTRAINT listings_reviewed_by_fkey FOREIGN KEY (reviewed_by)
    REFERENCES users (user_id) ON DELETE SET NULL,
  CONSTRAINT listings_property_type_id_fkey FOREIGN KEY (property_type_id)
    REFERENCES property_types (property_type_id) ON DELETE RESTRICT,
  CONSTRAINT listings_area_id_fkey FOREIGN KEY (area_id)
    REFERENCES areas (area_id) ON DELETE RESTRICT,
  CONSTRAINT listings_owner_id_fkey FOREIGN KEY (owner_id)
    REFERENCES property_owners (owner_id) ON DELETE RESTRICT,
  CONSTRAINT listings_bedrooms_check CHECK (bedrooms IS NULL OR bedrooms >= 0),
  CONSTRAINT listings_bathrooms_check CHECK (bathrooms IS NULL OR bathrooms >= 0),
  CONSTRAINT listings_beds_check CHECK (beds IS NULL OR beds >= 0),
  CONSTRAINT listings_rental_term_check CHECK (rental_term IN ('short_term', 'long_term', 'both')),
  CONSTRAINT listings_service_type_check CHECK (
    service_type IS NULL OR service_type IN ('VACATION_RENTAL', 'CAR_RENTAL', 'RESTAURANT_CAFE', 'ACTIVITY')
  ),
  CONSTRAINT listings_status_check CHECK (
    status IN ('approved', 'pending', 'rejected', 'changes_requested')
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS features (
  feature_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  PRIMARY KEY (feature_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS listing_features (
  listing_id INT UNSIGNED NOT NULL,
  feature_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (listing_id, feature_id),
  CONSTRAINT listing_features_listing_id_fkey FOREIGN KEY (listing_id)
    REFERENCES listings (listing_id) ON DELETE CASCADE,
  CONSTRAINT listing_features_feature_id_fkey FOREIGN KEY (feature_id)
    REFERENCES features (feature_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS listing_categories (
  listing_id INT UNSIGNED NOT NULL,
  category_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (listing_id, category_id),
  KEY listing_categories_category_listing_idx (category_id, listing_id),
  CONSTRAINT listing_categories_listing_id_fkey FOREIGN KEY (listing_id)
    REFERENCES listings (listing_id) ON DELETE CASCADE,
  CONSTRAINT listing_categories_category_id_fkey FOREIGN KEY (category_id)
    REFERENCES categories (category_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS listing_images (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  listing_id INT UNSIGNED,
  url VARCHAR(2048) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY listing_images_listing_sort_idx (listing_id, sort_order, id),
  CONSTRAINT listing_images_listing_id_fkey FOREIGN KEY (listing_id)
    REFERENCES listings (listing_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS bookings (
  booking_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  listing_id INT UNSIGNED,
  user_id INT UNSIGNED,
  start_date DATETIME(3),
  end_date DATETIME(3),
  total DECIMAL(12,2),
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  contact_first_name VARCHAR(100),
  contact_last_name VARCHAR(100),
  contact_email VARCHAR(320),
  contact_phone VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid',
  currency CHAR(3) NOT NULL DEFAULT 'MAD',
  cancelled_at DATETIME(3),
  processed_by INT UNSIGNED,
  processed_at DATETIME(3),
  rejection_reason TEXT,
  PRIMARY KEY (booking_id),
  KEY bookings_dashboard_idx (status, created_at DESC),
  KEY bookings_listing_dates_active_idx (listing_id, status, start_date, end_date),
  KEY bookings_user_created_idx (user_id, created_at DESC),
  CONSTRAINT bookings_listing_id_fkey FOREIGN KEY (listing_id)
    REFERENCES listings (listing_id) ON DELETE CASCADE,
  CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES users (user_id) ON DELETE CASCADE,
  CONSTRAINT bookings_processed_by_fkey FOREIGN KEY (processed_by)
    REFERENCES users (user_id) ON DELETE SET NULL,
  CONSTRAINT bookings_payment_status_check CHECK (
    payment_status IN ('unpaid', 'pending', 'paid', 'refunded')
  ),
  CONSTRAINT bookings_status_check CHECK (
    status IN ('pending', 'processing', 'confirmed', 'rejected', 'cancelled', 'completed', 'refunded')
  ),
  CONSTRAINT bookings_dates_check CHECK (
    start_date IS NULL OR end_date IS NULL OR end_date > start_date
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS reviews (
  review_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id INT UNSIGNED,
  rating INT,
  comment TEXT,
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (review_id),
  KEY reviews_booking_created_idx (booking_id, created_at DESC),
  CONSTRAINT reviews_booking_id_fkey FOREIGN KEY (booking_id)
    REFERENCES bookings (booking_id) ON DELETE CASCADE,
  CONSTRAINT reviews_rating_check CHECK (rating IS NULL OR rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS favorites (
  user_id INT UNSIGNED NOT NULL,
  listing_id INT UNSIGNED NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id, listing_id),
  KEY favorites_user_created_idx (user_id, created_at DESC, listing_id),
  CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES users (user_id) ON DELETE CASCADE,
  CONSTRAINT favorites_listing_id_fkey FOREIGN KEY (listing_id)
    REFERENCES listings (listing_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS announcement_requests (
  request_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  requester_id INT UNSIGNED,
  service_type VARCHAR(32) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  address VARCHAR(500) NOT NULL,
  contact_phone VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  reviewed_by INT UNSIGNED,
  review_reason TEXT,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  category_id INT UNSIGNED,
  map_url VARCHAR(2048),
  base_price DECIMAL(12,2),
  pricing_unit VARCHAR(30),
  guest_capacity INT UNSIGNED,
  contact_name VARCHAR(150),
  contact_email VARCHAR(320),
  property_type_id INT UNSIGNED,
  rental_term VARCHAR(20) NOT NULL DEFAULT 'short_term',
  PRIMARY KEY (request_id),
  KEY announcement_requests_status_idx (status, created_at DESC),
  CONSTRAINT announcement_requests_requester_id_fkey FOREIGN KEY (requester_id)
    REFERENCES users (user_id) ON DELETE CASCADE,
  CONSTRAINT announcement_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by)
    REFERENCES users (user_id) ON DELETE SET NULL,
  CONSTRAINT announcement_requests_category_id_fkey FOREIGN KEY (category_id)
    REFERENCES categories (category_id),
  CONSTRAINT announcement_requests_property_type_id_fkey FOREIGN KEY (property_type_id)
    REFERENCES property_types (property_type_id) ON DELETE RESTRICT,
  CONSTRAINT announcement_requests_pricing_unit_check CHECK (
    pricing_unit IS NULL OR pricing_unit IN ('night', 'day', 'hour', 'service')
  ),
  CONSTRAINT announcement_requests_rental_term_check CHECK (
    rental_term IN ('short_term', 'long_term', 'both')
  ),
  CONSTRAINT announcement_requests_service_type_check CHECK (
    service_type IN ('VACATION_RENTAL', 'CAR_RENTAL', 'RESTAURANT_CAFE', 'ACTIVITY')
  ),
  CONSTRAINT announcement_requests_status_check CHECK (
    status IN ('PENDING', 'ESCALATED', 'APPROVED', 'REJECTED')
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS announcement_request_images (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_id INT UNSIGNED NOT NULL,
  url VARCHAR(2048) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY announcement_request_images_request_sort_idx (request_id, sort_order, id),
  CONSTRAINT announcement_request_images_request_id_fkey FOREIGN KEY (request_id)
    REFERENCES announcement_requests (request_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS blog_posts (
  post_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  author_id INT UNSIGNED,
  category VARCHAR(32) NOT NULL,
  slug VARCHAR(120) NOT NULL,
  title VARCHAR(200) NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image_url VARCHAR(2048),
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at DATETIME(3),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (post_id),
  UNIQUE KEY blog_posts_slug_key (slug),
  KEY blog_posts_published_idx (is_published, published_at DESC),
  CONSTRAINT blog_posts_author_id_fkey FOREIGN KEY (author_id)
    REFERENCES users (user_id) ON DELETE CASCADE,
  CONSTRAINT blog_posts_category_check CHECK (
    category IN ('IDEAS_INSPIRATION', 'WELLBEING_BALANCE')
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS moderation_cases (
  case_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  entity_type VARCHAR(32) NOT NULL,
  entity_id INT UNSIGNED NOT NULL,
  assigned_to INT UNSIGNED,
  priority VARCHAR(20) NOT NULL DEFAULT 'normal',
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  due_at DATETIME(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3) + INTERVAL 24 HOUR),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (case_id),
  UNIQUE KEY moderation_cases_entity_type_entity_id_key (entity_type, entity_id),
  KEY moderation_cases_queue_idx (status, priority, due_at, created_at),
  KEY moderation_cases_assignee_idx (assigned_to, status, due_at),
  CONSTRAINT moderation_cases_assigned_to_fkey FOREIGN KEY (assigned_to)
    REFERENCES users (user_id) ON DELETE SET NULL,
  CONSTRAINT moderation_cases_entity_type_check CHECK (
    entity_type IN ('listing', 'announcement', 'booking')
  ),
  CONSTRAINT moderation_cases_priority_check CHECK (
    priority IN ('low', 'normal', 'high', 'urgent')
  ),
  CONSTRAINT moderation_cases_status_check CHECK (
    status IN ('open', 'claimed', 'decided', 'escalated')
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS moderation_decisions (
  decision_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  case_id INT UNSIGNED NOT NULL,
  actor_id INT UNSIGNED,
  decision VARCHAR(32) NOT NULL,
  reason_code VARCHAR(80) NOT NULL,
  note TEXT,
  previous_state JSON,
  next_state JSON,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (decision_id),
  KEY moderation_decisions_actor_idx (actor_id, created_at DESC),
  CONSTRAINT moderation_decisions_case_id_fkey FOREIGN KEY (case_id)
    REFERENCES moderation_cases (case_id) ON DELETE CASCADE,
  CONSTRAINT moderation_decisions_actor_id_fkey FOREIGN KEY (actor_id)
    REFERENCES users (user_id) ON DELETE SET NULL,
  CONSTRAINT moderation_decisions_decision_check CHECK (
    decision IN ('approved', 'rejected', 'changes_requested', 'escalated')
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor_id INT UNSIGNED,
  action VARCHAR(120),
  entity_type VARCHAR(80),
  entity_id INT UNSIGNED,
  reason TEXT,
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY audit_logs_actor_created_idx (actor_id, created_at DESC),
  KEY audit_logs_dashboard_idx (created_at DESC, actor_id, entity_type),
  KEY audit_logs_entity_created_idx (entity_type, entity_id, created_at DESC),
  CONSTRAINT audit_logs_actor_id_fkey FOREIGN KEY (actor_id)
    REFERENCES users (user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS legal_documents (
  document_type VARCHAR(20) NOT NULL,
  version VARCHAR(64) NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  requires_reacceptance BOOLEAN NOT NULL DEFAULT FALSE,
  effective_at DATE,
  published_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  current_document_type VARCHAR(20)
    GENERATED ALWAYS AS (CASE WHEN is_current THEN document_type ELSE NULL END) STORED,
  PRIMARY KEY (document_type, version),
  UNIQUE KEY legal_documents_one_current_type_idx (current_document_type),
  CONSTRAINT legal_documents_document_type_check CHECK (document_type IN ('terms', 'privacy'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS user_legal_consents (
  consent_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  document_type VARCHAR(20) NOT NULL,
  document_version VARCHAR(64) NOT NULL,
  accepted_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  accepted_language VARCHAR(5) NOT NULL,
  PRIMARY KEY (consent_id),
  UNIQUE KEY user_legal_consents_user_document_key (
    user_id, document_type, document_version
  ),
  KEY user_legal_consents_user_type_idx (user_id, document_type, accepted_at DESC),
  CONSTRAINT user_legal_consents_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES users (user_id) ON DELETE CASCADE,
  CONSTRAINT user_legal_consents_document_fkey FOREIGN KEY (document_type, document_version)
    REFERENCES legal_documents (document_type, version) ON DELETE RESTRICT,
  CONSTRAINT user_legal_consents_accepted_language_check CHECK (
    accepted_language IN ('en', 'fr', 'ar')
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS listing_availability_blocks (
  block_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  listing_id INT UNSIGNED NOT NULL,
  start_date DATETIME(3) NOT NULL,
  end_date DATETIME(3) NOT NULL,
  note VARCHAR(500),
  created_by INT UNSIGNED,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (block_id),
  KEY listing_availability_blocks_dates_idx (listing_id, start_date, end_date),
  CONSTRAINT listing_availability_blocks_listing_id_fkey FOREIGN KEY (listing_id)
    REFERENCES listings (listing_id) ON DELETE CASCADE,
  CONSTRAINT listing_availability_blocks_created_by_fkey FOREIGN KEY (created_by)
    REFERENCES users (user_id) ON DELETE SET NULL,
  CONSTRAINT listing_availability_blocks_dates_check CHECK (end_date > start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
