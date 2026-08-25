ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active';
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_account_status_check;
ALTER TABLE users ADD CONSTRAINT users_account_status_check
CHECK (account_status IN ('active', 'suspended'));

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'confirmed';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'MAD';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
CHECK (status IN ('confirmed', 'cancelled', 'completed', 'refunded'));
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_payment_status_check
CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'refunded'));

ALTER TABLE listings ADD COLUMN IF NOT EXISTS submitted_at timestamptz;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS reviewed_by integer REFERENCES users (user_id) ON DELETE SET NULL;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS rejection_reason text;
UPDATE listings SET submitted_at = COALESCE(submitted_at, created_at);

CREATE TABLE IF NOT EXISTS moderation_cases (
    case_id serial PRIMARY KEY,
    entity_type text NOT NULL CHECK (entity_type IN ('listing', 'announcement')),
    entity_id integer NOT NULL,
    assigned_to integer REFERENCES users (user_id) ON DELETE SET NULL,
    priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'claimed', 'decided', 'escalated')),
    due_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (entity_type, entity_id)
);

CREATE TABLE IF NOT EXISTS moderation_decisions (
    decision_id serial PRIMARY KEY,
    case_id integer NOT NULL REFERENCES moderation_cases (case_id) ON DELETE CASCADE,
    actor_id integer REFERENCES users (user_id) ON DELETE SET NULL,
    decision text NOT NULL CHECK (decision IN ('approved', 'rejected', 'changes_requested', 'escalated')),
    reason_code text NOT NULL,
    note text,
    previous_state jsonb,
    next_state jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS moderation_cases_queue_idx
ON moderation_cases (status, priority, due_at, created_at);
CREATE INDEX IF NOT EXISTS moderation_cases_assignee_idx
ON moderation_cases (assigned_to, status, due_at);
CREATE INDEX IF NOT EXISTS moderation_decisions_actor_idx
ON moderation_decisions (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS bookings_dashboard_idx
ON bookings (status, created_at DESC);
CREATE INDEX IF NOT EXISTS users_dashboard_idx
ON users (account_status, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_dashboard_idx
ON audit_logs (created_at DESC, actor_id, entity_type);

INSERT INTO moderation_cases (entity_type, entity_id, created_at, due_at)
SELECT 'listing', listing_id, COALESCE(submitted_at, created_at), COALESCE(submitted_at, created_at) + interval '24 hours'
FROM listings
WHERE status = 'pending'
ON CONFLICT (entity_type, entity_id) DO NOTHING;

INSERT INTO moderation_cases (entity_type, entity_id, created_at, due_at)
SELECT 'announcement', request_id, created_at, created_at + interval '24 hours'
FROM announcement_requests
WHERE status = 'PENDING'
ON CONFLICT (entity_type, entity_id) DO NOTHING;
