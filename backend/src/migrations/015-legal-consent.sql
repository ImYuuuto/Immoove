CREATE TABLE IF NOT EXISTS legal_documents (
    document_type text NOT NULL CHECK (document_type IN ('terms', 'privacy')),
    version text NOT NULL,
    is_current boolean NOT NULL DEFAULT false,
    requires_reacceptance boolean NOT NULL DEFAULT false,
    effective_at date,
    published_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (document_type, version)
);

CREATE UNIQUE INDEX IF NOT EXISTS legal_documents_one_current_type_idx
ON legal_documents(document_type) WHERE is_current;

CREATE TABLE IF NOT EXISTS user_legal_consents (
    consent_id bigserial PRIMARY KEY,
    user_id integer NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    document_type text NOT NULL,
    document_version text NOT NULL,
    accepted_at timestamptz NOT NULL DEFAULT now(),
    accepted_language text NOT NULL CHECK (accepted_language IN ('en', 'fr', 'ar')),
    FOREIGN KEY (document_type, document_version)
        REFERENCES legal_documents(document_type, version) ON DELETE RESTRICT,
    UNIQUE (user_id, document_type, document_version)
);

CREATE INDEX IF NOT EXISTS user_legal_consents_user_type_idx
ON user_legal_consents(user_id, document_type, accepted_at DESC);

INSERT INTO legal_documents
    (document_type, version, is_current, requires_reacceptance, effective_at)
VALUES
    ('terms', '1.0', true, true, NULL),
    ('privacy', '1.0-draft', true, false, NULL)
ON CONFLICT (document_type, version) DO UPDATE SET
    is_current = EXCLUDED.is_current,
    requires_reacceptance = EXCLUDED.requires_reacceptance;

-- Preserve legacy acceptance evidence when both timestamp and version exist.
INSERT INTO user_legal_consents
    (user_id, document_type, document_version, accepted_at, accepted_language)
SELECT u.user_id, 'terms', u.terms_version, u.terms_accepted_at, 'en'
FROM users u
JOIN legal_documents d
  ON d.document_type = 'terms' AND d.version = u.terms_version
WHERE u.terms_accepted_at IS NOT NULL
ON CONFLICT (user_id, document_type, document_version) DO NOTHING;

CREATE OR REPLACE FUNCTION enforce_new_user_terms_consent()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM legal_documents d
        WHERE d.document_type = 'terms'
          AND d.is_current = true
          AND d.requires_reacceptance = true
          AND NOT EXISTS (
              SELECT 1 FROM user_legal_consents c
              WHERE c.user_id = NEW.user_id
                AND c.document_type = d.document_type
                AND c.document_version = d.version
          )
    ) THEN
        RAISE EXCEPTION 'A current Terms consent record is required for every new account'
            USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_require_terms_consent ON users;
CREATE CONSTRAINT TRIGGER users_require_terms_consent
AFTER INSERT ON users
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION enforce_new_user_terms_consent();
