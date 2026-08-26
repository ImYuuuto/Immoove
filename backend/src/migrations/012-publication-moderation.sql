ALTER TABLE bookings ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS processed_by integer REFERENCES users(user_id) ON DELETE SET NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS processed_at timestamptz;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
CHECK (status IN ('pending','processing','confirmed','rejected','cancelled','completed','refunded'));

ALTER TABLE listings ADD COLUMN IF NOT EXISTS map_url text;

ALTER TABLE announcement_requests ADD COLUMN IF NOT EXISTS category_id integer REFERENCES categories(category_id);
ALTER TABLE announcement_requests ADD COLUMN IF NOT EXISTS map_url text;
ALTER TABLE announcement_requests ADD COLUMN IF NOT EXISTS base_price numeric;
ALTER TABLE announcement_requests ADD COLUMN IF NOT EXISTS pricing_unit text;
ALTER TABLE announcement_requests ADD COLUMN IF NOT EXISTS guest_capacity integer;
ALTER TABLE announcement_requests ADD COLUMN IF NOT EXISTS contact_name text;
ALTER TABLE announcement_requests ADD COLUMN IF NOT EXISTS contact_email text;
ALTER TABLE announcement_requests DROP CONSTRAINT IF EXISTS announcement_requests_status_check;
ALTER TABLE announcement_requests ADD CONSTRAINT announcement_requests_status_check
CHECK (status IN ('PENDING','ESCALATED','APPROVED','REJECTED'));
ALTER TABLE announcement_requests DROP CONSTRAINT IF EXISTS announcement_requests_pricing_unit_check;
ALTER TABLE announcement_requests ADD CONSTRAINT announcement_requests_pricing_unit_check
CHECK (pricing_unit IS NULL OR pricing_unit IN ('night','day','hour','service'));

CREATE TABLE IF NOT EXISTS announcement_request_images (
  id serial PRIMARY KEY,
  request_id integer NOT NULL REFERENCES announcement_requests(request_id) ON DELETE CASCADE,
  url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE moderation_cases DROP CONSTRAINT IF EXISTS moderation_cases_entity_type_check;
ALTER TABLE moderation_cases ADD CONSTRAINT moderation_cases_entity_type_check
CHECK (entity_type IN ('listing','announcement','booking'));

INSERT INTO moderation_cases (entity_type, entity_id, created_at, due_at)
SELECT 'booking', booking_id, created_at, created_at + interval '4 hours'
FROM bookings WHERE status IN ('pending','processing')
ON CONFLICT (entity_type, entity_id) DO NOTHING;
