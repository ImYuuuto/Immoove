UPDATE listings SET status = 'rejected'
WHERE status = 'changes_requested';
DROP TABLE IF EXISTS listing_availability_blocks;
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_beds_check;
ALTER TABLE listings DROP COLUMN IF EXISTS beds;
DROP INDEX IF EXISTS listings_owner_dashboard_idx;
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_status_check;
ALTER TABLE listings ADD CONSTRAINT listings_status_check
CHECK (status IN ('approved', 'pending', 'rejected'));
