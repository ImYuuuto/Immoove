ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url text;

ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_provider_id_fkey;
ALTER TABLE listings
ADD CONSTRAINT listings_provider_id_fkey
FOREIGN KEY (provider_id) REFERENCES users (user_id) ON DELETE CASCADE;

ALTER TABLE announcement_requests
DROP CONSTRAINT IF EXISTS announcement_requests_requester_id_fkey;
ALTER TABLE announcement_requests
ADD CONSTRAINT announcement_requests_requester_id_fkey
FOREIGN KEY (requester_id) REFERENCES users (user_id) ON DELETE CASCADE;

ALTER TABLE announcement_requests
DROP CONSTRAINT IF EXISTS announcement_requests_reviewed_by_fkey;
ALTER TABLE announcement_requests
ADD CONSTRAINT announcement_requests_reviewed_by_fkey
FOREIGN KEY (reviewed_by) REFERENCES users (user_id) ON DELETE SET NULL;

ALTER TABLE blog_posts DROP CONSTRAINT IF EXISTS blog_posts_author_id_fkey;
ALTER TABLE blog_posts
ADD CONSTRAINT blog_posts_author_id_fkey
FOREIGN KEY (author_id) REFERENCES users (user_id) ON DELETE CASCADE;

ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_actor_id_fkey;
ALTER TABLE audit_logs
ADD CONSTRAINT audit_logs_actor_id_fkey
FOREIGN KEY (actor_id) REFERENCES users (user_id) ON DELETE SET NULL;
