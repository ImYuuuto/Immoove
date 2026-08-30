ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_status_check;
ALTER TABLE listings ADD CONSTRAINT listings_status_check
CHECK (status IN ('approved', 'pending', 'rejected', 'changes_requested'));

ALTER TABLE listings ADD COLUMN IF NOT EXISTS beds integer;
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_beds_check;
ALTER TABLE listings ADD CONSTRAINT listings_beds_check CHECK (beds IS NULL OR beds >= 0);
UPDATE listings SET beds = GREATEST(1, COALESCE(bedrooms, 1))
WHERE beds IS NULL AND service_type = 'VACATION_RENTAL';

CREATE TABLE IF NOT EXISTS listing_availability_blocks (
  block_id bigserial PRIMARY KEY,
  listing_id integer NOT NULL REFERENCES listings(listing_id) ON DELETE CASCADE,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  note text,
  created_by integer REFERENCES users(user_id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date > start_date)
);
CREATE INDEX IF NOT EXISTS listing_availability_blocks_dates_idx
ON listing_availability_blocks(listing_id, start_date, end_date);

CREATE INDEX IF NOT EXISTS listings_owner_dashboard_idx
ON listings(provider_id, status, updated_at DESC);
