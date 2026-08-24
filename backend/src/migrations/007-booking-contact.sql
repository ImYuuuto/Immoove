ALTER TABLE bookings ADD COLUMN IF NOT EXISTS contact_first_name text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS contact_last_name text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS contact_email text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS contact_phone text;
