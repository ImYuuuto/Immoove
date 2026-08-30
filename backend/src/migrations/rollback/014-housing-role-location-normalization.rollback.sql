BEGIN;

LOCK TABLE users, listings, moderation_cases IN SHARE ROW EXCLUSIVE MODE;

ALTER TABLE users ALTER COLUMN role DROP NOT NULL;
ALTER TABLE users ALTER COLUMN role DROP DEFAULT;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

UPDATE users u SET
    role = b.role,
    account_status = b.account_status,
    session_version = b.session_version
FROM migration_014_users_backup b WHERE b.user_id = u.user_id;

-- Accounts created after migration 014 have no snapshot. Map their normalized
-- roles to values accepted by the legacy application before restoring its check.
UPDATE users u SET role = CASE
    WHEN role = 'OWNER' THEN 'provider'
    WHEN role = 'CLIENT' THEN 'user'
    ELSE role
END
WHERE NOT EXISTS (SELECT 1 FROM migration_014_users_backup b WHERE b.user_id = u.user_id);

UPDATE listings l SET
    status = b.status,
    is_active = b.is_active,
    archived_at = b.archived_at,
    archive_reason = b.archive_reason
FROM migration_014_listings_backup b WHERE b.listing_id = l.listing_id;

UPDATE moderation_cases mc SET
    status = b.status,
    assigned_to = b.assigned_to,
    updated_at = b.updated_at
FROM migration_014_moderation_backup b WHERE b.case_id = mc.case_id;

ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (
    role IS NULL OR role IN ('CLIENT','HOST','ADMIN','client','provider','staff','moderator','admin','user')
);

ALTER TABLE listings DROP COLUMN IF EXISTS area_id;
ALTER TABLE listings DROP COLUMN IF EXISTS property_type_id;
ALTER TABLE listings DROP COLUMN IF EXISTS archived_at;
ALTER TABLE listings DROP COLUMN IF EXISTS archive_reason;
DROP TABLE IF EXISTS areas;
DROP TABLE IF EXISTS cities;
DROP TABLE IF EXISTS regions;
DROP TABLE IF EXISTS property_types;
ALTER TABLE users DROP COLUMN IF EXISTS privacy_accepted_at;
ALTER TABLE users DROP COLUMN IF EXISTS terms_version;
ALTER TABLE users DROP COLUMN IF EXISTS terms_accepted_at;

DROP TABLE migration_014_moderation_backup;
DROP TABLE migration_014_listings_backup;
DROP TABLE migration_014_users_backup;

COMMIT;
