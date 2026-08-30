INSERT INTO property_types (name, slug, is_active)
VALUES ('Riad', 'riad', true)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, is_active = true;

ALTER TABLE listings ADD COLUMN IF NOT EXISTS bedrooms integer;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS bathrooms integer;

ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_bedrooms_check;
ALTER TABLE listings ADD CONSTRAINT listings_bedrooms_check
CHECK (bedrooms IS NULL OR bedrooms >= 0);
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_bathrooms_check;
ALTER TABLE listings ADD CONSTRAINT listings_bathrooms_check
CHECK (bathrooms IS NULL OR bathrooms >= 0);

UPDATE listings l SET property_type_id = pt.property_type_id
FROM property_types pt
WHERE pt.slug = 'riad' AND lower(l.title) ~ '\mriad\M';

UPDATE listings SET bedrooms = CASE
  WHEN guest_capacity IS NULL THEN NULL
  ELSE GREATEST(1, CEIL(guest_capacity::numeric / 2)::integer)
END
WHERE bedrooms IS NULL AND service_type = 'VACATION_RENTAL';

UPDATE listings SET bathrooms = CASE
  WHEN bedrooms IS NULL THEN NULL
  ELSE GREATEST(1, CEIL(bedrooms::numeric / 2)::integer)
END
WHERE bathrooms IS NULL AND service_type = 'VACATION_RENTAL';

CREATE INDEX IF NOT EXISTS listings_property_discovery_idx
ON listings(property_type_id, area_id, guest_capacity, bedrooms, bathrooms, base_price)
WHERE status = 'approved' AND is_active = true AND archived_at IS NULL;
