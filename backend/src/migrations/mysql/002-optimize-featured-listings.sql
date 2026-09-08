-- Optimize the public featured-listing filter and ordering.
-- archived_at must precede the ORDER BY columns so MySQL can satisfy both
-- the equality predicates and ordering from one index scan.
ALTER TABLE listings
  DROP INDEX listings_public_featured_idx,
  ADD KEY listings_public_featured_idx (
    status,
    is_active,
    archived_at,
    is_featured DESC,
    created_at DESC
  );

