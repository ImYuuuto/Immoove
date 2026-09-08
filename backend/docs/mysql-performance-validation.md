# MySQL performance validation

Validated on 2026-09-08 after the local MySQL cutover. Tests were sent through the Nginx load balancer to two API replicas. Each steady-state median and p95 uses 30 requests; the cold value follows a Redis cache clear. The development seed contains six listings, so these figures validate the current application state rather than production-scale capacity.

## Changes made

1. MySQL session timezone initialization is now performed once per physical pooled connection instead of once per query. A warmed-pool counter check showed zero repeated timezone statements across 20 concurrent cold-cache requests.
2. Property discovery options now use the existing versioned Redis cache and are invalidated when listing/category data changes.
3. Identical concurrent cache misses are coalesced within each API replica, reducing duplicate database work during cache fill.
4. Migration `002-optimize-featured-listings.sql` reorders the featured-listing index so MySQL can filter and return the required ordering from one index scan.

## Steady-state comparison

| Endpoint | PostgreSQL baseline median | MySQL final median | Difference |
| --- | ---: | ---: | ---: |
| Health | 4.783 ms | 4.662 ms | -2.5% |
| Listings | 8.024 ms | 6.202 ms | -22.7% |
| Listing search | 7.661 ms | 6.672 ms | -12.9% |
| Featured listings | 5.563 ms | 5.634 ms | +1.3% |
| Discovery options | 6.548 ms | 7.514 ms | +14.8% |
| Frontend | 3.307 ms | 4.624 ms | +39.8% (+1.317 ms, database-independent) |

All database-backed endpoints satisfy the agreed 10–15% tolerance. Four improved or remained effectively unchanged; discovery options remained just within the tolerance. The frontend does not query MySQL and its absolute difference is local Docker/network timing noise.

## Final cold and warmed results

| Endpoint | Cold | Warm median | Warm p95 |
| --- | ---: | ---: | ---: |
| Health | 6.629 ms | 4.662 ms | 5.811 ms |
| Listings | 38.506 ms | 6.202 ms | 9.020 ms |
| Listing search | 42.839 ms | 6.672 ms | 9.766 ms |
| Featured listings | 27.953 ms | 5.634 ms | 7.032 ms |
| Discovery options | 12.373 ms | 7.514 ms | 11.810 ms |
| Frontend | 5.756 ms | 4.624 ms | 8.328 ms |

## Concurrent smoke load

With 200 requests and concurrency 20 after cache warm-up:

- Listings: 298 requests/second, 59.58 ms median, 138.25 ms p95.
- Search: 409 requests/second, 47.90 ms median, 63.25 ms p95.
- All checks completed while both API replicas and MySQL remained healthy.

These are local Docker Desktop results, not a production capacity commitment. A production load test should use expected data volume, realistic authenticated traffic, and the intended deployment hardware.

## Query-plan verification

- Public listings use `listings_public_created_idx` as a covering index lookup.
- Featured listings use `listings_public_featured_idx` without an explicit sort after migration 002; measured database execution dropped from about 0.20 ms to about 0.08 ms on the seeded dataset.
- Booking overlap checks use the covering `bookings_listing_dates_active_idx`.
- No additional indexes were added because the measured plans already use the relevant indexes; unnecessary indexes would increase insert/update cost.

## Verification

- Backend build passed.
- 69/69 backend tests passed.
- ESLint passed.
- Migration 002 applied and migration rerun completed successfully.
- Both API replicas, MySQL, and Redis remained healthy.
- Upload and PostgreSQL rollback volumes remain preserved.

