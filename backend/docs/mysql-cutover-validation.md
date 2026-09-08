# MySQL local cutover validation

Validated on 2026-09-08 for step 9 of the PostgreSQL-to-MySQL migration.

## Cutover result

- Docker Compose now runs MySQL 8.4.11 using database `ImmooveDB` and application user `immoove-admin`.
- The schema migration completed successfully and an immediate rerun completed without changing the schema.
- The development seed completed successfully from both the host and the production-style backend image.
- Two backend API replicas returned to healthy status behind the load balancer.
- Redis, the frontend, and MySQL are running.
- The existing `backend_postgres_data` volume was preserved for rollback.
- The existing `backend_uploads` volume was preserved and mounted into both API replicas.

## Seeded MySQL data

- users: 3
- listings: 6
- bookings: 3
- reviews: 1
- listing images: 10
- property owners: 2
- total schema tables: 26

## HTTP smoke test

All acceptance URLs returned HTTP 200:

- `GET /health`
- `GET /api/v1/listings`
- `GET /api/v1/listings/search`
- `GET /api/v1/listings/featured`
- `GET /api/v1/property-discovery/options`
- frontend `GET /`

A seeded media asset at `/uploads/site/listings/maison-bleue.jpg` returned HTTP 200 as `image/jpeg` with 133,860 bytes.

## Preservation and rollback

The following Docker volumes coexist after cutover:

- `backend_mysql_data`: active MySQL database
- `backend_postgres_data`: preserved PostgreSQL rollback database
- `backend_uploads`: preserved user media

The pre-migration media backup remains at `backend/rollback/mysql-migration/uploads-before-mysql.zip`.

## Performance follow-up

Step 10 is complete. See `mysql-performance-validation.md` for the PostgreSQL comparison, MySQL query-plan checks, concurrency results, and applied optimizations.
