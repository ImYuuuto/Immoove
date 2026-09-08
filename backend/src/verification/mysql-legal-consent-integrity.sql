-- Expected result: zero rows.
-- Run after seeding, deployments, and any manual account repair operation.
SELECT
  u.user_id,
  u.email,
  d.version AS required_terms_version
FROM users AS u
JOIN legal_documents AS d
  ON d.document_type = 'terms'
 AND d.is_current = TRUE
 AND d.requires_reacceptance = TRUE
LEFT JOIN user_legal_consents AS c
  ON c.user_id = u.user_id
 AND c.document_type = d.document_type
 AND c.document_version = d.version
WHERE c.consent_id IS NULL;
