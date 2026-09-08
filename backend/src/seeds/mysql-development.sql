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

COMMIT;
