DROP INDEX IF EXISTS listings_property_discovery_idx;
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_bathrooms_check;
ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_bedrooms_check;
ALTER TABLE listings DROP COLUMN IF EXISTS bathrooms;
ALTER TABLE listings DROP COLUMN IF EXISTS bedrooms;
UPDATE listings SET property_type_id = (
  SELECT property_type_id FROM property_types WHERE slug = 'guest-house'
) WHERE property_type_id = (SELECT property_type_id FROM property_types WHERE slug = 'riad');
DELETE FROM property_types WHERE slug = 'riad';
