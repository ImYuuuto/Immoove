-- Remove only the original pre-owner sample catalogue. Users are intentionally preserved.
-- The tight ID and architecture checks prevent this cleanup from touching current properties.
DELETE FROM listings
WHERE listing_id BETWEEN 1 AND 11
  AND owner_id IS NULL
  AND contract_number IS NULL;
