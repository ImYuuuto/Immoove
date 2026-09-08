# PostgreSQL baseline before MySQL migration

Captured on 2026-09-07 from branch `codex/mysql-migration`.

## Repository state

- Starting branch: `main`
- Migration branch: `codex/mysql-migration`
- Pre-existing workspace change preserved: `schema.sql` was deleted before this work began.
- No database or application source files were changed during baseline capture.

## Media preservation

- Source directory: `backend/upload`
- Files: 97
- Total size: 3,366,168 bytes (3.21 MB)
- Backup: `backend/rollback/mysql-migration/uploads-before-mysql.zip`
- Backup SHA-256: `E2C6CD78DC2A7A1C240E988D38127DD8FD10D7786B55CEEC7794E94D2D2E83AA`

The Docker `uploads` volume and the PostgreSQL volume remain intact.

## Verification baseline

- Backend TypeScript build: passed
- Frontend TypeScript and production build: passed
- Backend test suites: 16 passed
- Backend tests: 67 passed
- Frontend build warning: three Vite public-asset placeholders remained unresolved for runtime resolution. This warning existed before the MySQL migration.

## Development dataset

- users: 19
- listings: 32
- bookings: 25
- reviews: 12
- listing_images: 96
- favorites: 2
- property_owners: 8

## HTTP performance baseline

Five sequential requests were made from the host through the Docker-published ports. Values are wall-clock milliseconds and include HTTP and proxy overhead.

| Endpoint | Status | First request | Median of five |
| --- | ---: | ---: | ---: |
| `GET /health` | 200 | 4.783 | 4.783 |
| `GET /api/v1/listings` | 200 | 190.870 | 8.024 |
| `GET /api/v1/listings/search` | 200 | 152.582 | 7.661 |
| `GET /api/v1/listings/featured` | 200 | 9.007 | 5.563 |
| `GET /api/v1/property-discovery/options` | 200 | 7.703 | 6.548 |
| Frontend `/` | 200 | 3.320 | 3.307 |

The slower initial listing requests are consistent with cold application/database/cache behavior. Preserve both first-request and warmed median measurements when comparing MySQL.

## MySQL acceptance criteria

- All 67 existing backend tests continue to pass.
- Backend and frontend production builds pass.
- The six baseline URLs return HTTP 200.
- Seeded MySQL data provides enough rows to exercise the same query paths.
- Warmed median response time should remain within 10–15% of this baseline where the datasets are comparable.
- Query counts per request should not increase materially.
- Uploaded images and documents remain accessible under `/uploads`.
