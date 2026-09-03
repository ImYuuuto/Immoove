CREATE TABLE IF NOT EXISTS property_owners (
  owner_id serial PRIMARY KEY,
  first_name text NOT NULL,
  last_name text NOT NULL,
  national_id_code text NOT NULL UNIQUE,
  phone text NOT NULL,
  email text,
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE listings ADD COLUMN IF NOT EXISTS owner_id integer
  REFERENCES property_owners(owner_id) ON DELETE RESTRICT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS contract_number text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS contract_document_url text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS location_text text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS latitude numeric(10,7);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS longitude numeric(10,7);

CREATE UNIQUE INDEX IF NOT EXISTS listings_contract_number_unique_idx
ON listings (lower(contract_number)) WHERE contract_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS property_owners_name_idx
ON property_owners (lower(first_name), lower(last_name));
CREATE INDEX IF NOT EXISTS listings_owner_idx ON listings(owner_id, created_at DESC);
