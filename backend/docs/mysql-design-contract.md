# MySQL migration design contract

This document fixes the database conventions for the Immoove PostgreSQL-to-MySQL migration. Later implementation steps should follow these decisions unless a failing integration test proves that a change is necessary.

## 1. Target platform

- MySQL 8.4 LTS, pinned to an explicit patch-level Docker image when the Docker change is made.
- InnoDB for every table.
- One application database using `utf8mb4`.
- Default collation: `utf8mb4_0900_ai_ci`.
- Strict SQL mode, including `STRICT_TRANS_TABLES`, `ERROR_FOR_DIVISION_BY_ZERO`, and `NO_ENGINE_SUBSTITUTION`.
- Database, server connection, migration connection, and application pool time zone set to UTC (`+00:00`).
- Transaction isolation set to `READ COMMITTED` to stay close to PostgreSQL's current default behavior.

The selected collation gives case-insensitive and accent-insensitive matching for the current Arabic, French, and English content. Identifiers that must be case-sensitive, such as migration checksums, will use an explicit binary collation.

## 2. Identifier conventions

- Existing table and column names remain unchanged.
- Existing numeric primary keys become `INT UNSIGNED NOT NULL AUTO_INCREMENT`.
- Every foreign-key column uses the same unsigned type as its referenced key.
- Join-table keys remain composite primary keys.
- No UUID conversion is included in this migration.
- Application-facing IDs remain JavaScript `number` values.

The current development data and expected project scale do not require `BIGINT`. Avoiding it also prevents MySQL driver string-conversion issues.

## 3. Numeric conventions

- Monetary amounts such as `base_price` and booking `total` use `DECIMAL(12,2)`.
- Latitude and longitude use `DECIMAL(10,7)`.
- Ratings, capacities, bedroom counts, bathroom counts, sort orders, and session versions use appropriately constrained integer columns.
- Decimal values returned by `mysql2` are normalized with the project's existing numeric mapping helpers before reaching API responses.
- Monetary calculations remain in SQL using decimal operands; floating-point database columns are not permitted for money.

`DECIMAL(12,2)` supports values far above the application's current validated maximum price of 10,000,000 while retaining centime precision.

## 4. Text conventions

Use bounded `VARCHAR` columns for values that are validated, compared, joined, or indexed:

- Names: `VARCHAR(100)` unless a current validator allows more.
- Emails: `VARCHAR(320)` to cover the widest current API validation.
- Phone numbers and national identity codes: `VARCHAR(50)`.
- Listing titles: `VARCHAR(200)`.
- Slugs: `VARCHAR(120)`.
- Status, role, service, rental-term, pricing-unit, currency, and document-type codes: bounded `VARCHAR` columns sized for their validated values.
- Contract numbers: `VARCHAR(100)`.
- URLs and filesystem-backed media paths: `VARCHAR(2048)`.
- Migration filenames: `VARCHAR(255)`.
- SHA-256 migration checksums: `CHAR(64)` with `ascii_bin` collation.

Use `TEXT` for descriptions, comments, notes, reasons, addresses, excerpts, legal-document content, and other prose. Keep the existing application validation limits as the primary request boundary and add database checks for critical business limits where useful.

Do not use MySQL `ENUM`. Status-like values remain `VARCHAR` plus `CHECK` constraints so future application states can be added through ordinary migrations.

## 5. Date and time conventions

- Replace PostgreSQL `timestamptz` with MySQL `DATETIME(3)`.
- Store every database date/time value as UTC.
- Use `CURRENT_TIMESTAMP(3)` for database-generated timestamps.
- Use `ON UPDATE CURRENT_TIMESTAMP(3)` only where the current application truly expects automatic `updated_at` behavior; otherwise updates remain explicit.
- Configure `mysql2` with `timezone: 'Z'`.
- API inputs and outputs remain ISO-8601 strings with an explicit UTC offset.
- The frontend remains responsible only for converting UTC values to the user's display locale.

`DATETIME(3)` is selected instead of `TIMESTAMP` to avoid range limitations and implicit server-time-zone conversions. Booking dates retain their current instant-based behavior rather than being converted to date-only columns during this migration.

## 6. Boolean and JSON conventions

- PostgreSQL `boolean` becomes MySQL `BOOLEAN` (stored by MySQL as `TINYINT(1)`).
- Database result mapping must expose booleans as JavaScript `boolean`, not `0` or `1`, at API boundaries.
- PostgreSQL `jsonb` becomes MySQL `JSON`.
- JSON objects are passed as JSON values or serialized once by the database adapter, never interpolated into SQL.
- No JSON index is required initially because the current JSON fields are audit snapshots rather than query filters.

## 7. Search conventions

The first MySQL implementation will preserve behavior with `LIKE` under `utf8mb4_0900_ai_ci` rather than introducing `FULLTEXT` immediately.

- User search uses `CONCAT_WS(' ', first_name, last_name) LIKE ?`.
- Owner search uses the same name expression plus national identity and contract-number matching.
- Listing search uses `title LIKE ? OR description LIKE ?`.
- Search inputs continue to escape or deliberately interpret `%` and `_` according to current API behavior.
- Exact lookup fields such as email, slug, contract number, status, and foreign keys receive ordinary B-tree indexes.
- Listing discovery receives composite indexes based on its equality filters and `is_featured, created_at` ordering.

Leading-wildcard searches cannot efficiently use ordinary B-tree indexes. The development dataset is small, so correctness comes first. Step 10 will use realistic seed volume and `EXPLAIN ANALYZE`; MySQL `FULLTEXT` will be introduced only if listing or administrative search misses the recorded performance target.

## 8. Constraint and transaction conventions

- Preserve all primary-key, foreign-key, unique, and meaningful check constraints.
- Preserve current `ON DELETE CASCADE`, `SET NULL`, and `RESTRICT` behavior.
- Registration inserts the user and required legal-consent records in one transaction.
- The PostgreSQL deferred legal-consent trigger will not be recreated as a MySQL trigger; an integration-tested service transaction will enforce the invariant.
- Booking creation and booking date changes continue to lock the listing row with `SELECT ... FOR UPDATE` before checking conflicts.
- Transaction helpers must always acquire one pooled connection, commit on success, roll back on failure, and release the connection in `finally`.
- Deadlocks and lock timeouts are surfaced as retryable database errors; automatic retries, if added, must be bounded and restricted to idempotent transaction functions.

## 9. Result and query conventions

- Runtime queries use `?` parameters exclusively.
- Values are never interpolated into SQL. Dynamic `IN` lists generate only placeholder tokens and pass values separately.
- The database adapter exposes project-owned result types: `rows`, `rowCount`, and optional `insertId`.
- Insert operations use `insertId`; update and delete operations use affected-row checks and a follow-up select only when the endpoint must return the updated object.
- Upserts name the unique key whose conflict is expected. `INSERT IGNORE` is not used as a general replacement for `ON CONFLICT DO NOTHING` because it can hide unrelated data errors.
- Driver-returned decimal and count strings are normalized explicitly.

## 10. Schema and performance scope

- The MySQL baseline represents the current final schema directly; it will not replay the historical PostgreSQL alteration sequence.
- The three `migration_014_*_backup` tables are historical migration artifacts and will not be created in the clean MySQL baseline.
- Development seed data is separated from structural schema creation.
- Media remains on the existing upload filesystem/volume. MySQL stores only its URL/path metadata.
- Redis caching behavior remains unchanged during the database migration.
- Initial indexes reproduce current foreign-key, uniqueness, discovery-filter, ordering, booking-overlap, moderation-queue, and profile-history access paths.
- Step 10 compares cold and warmed results against `mysql-migration-baseline.md`; warmed medians should remain within 10-15% when datasets are comparable.

## Implementation gate for step 3

Step 3 may proceed when its database adapter can support these behaviors without leaking `mysql2` types into services:

1. Pooled parameterized queries.
2. Single-connection transactions.
3. `rows`, `rowCount`, and `insertId` result metadata.
4. UTC date handling.
5. Explicit decimal/count conversion.
6. Predictable boolean mapping at API boundaries.

## Step 4 validation record

The clean schema in `src/migrations/mysql/001-immoove-baseline.sql` was executed against MySQL 8.4.11 on 2026-09-07.

- PostgreSQL source tables after excluding `migration_014_*`: 26.
- MySQL baseline tables created: 26.
- MySQL table constraints created: 100, including 25 check constraints.
- MySQL indexes created, counting primary and unique indexes: 65.
- Non-InnoDB or incorrectly collated tables: 0.
- `TIMESTAMP`, `ENUM`, `FLOAT`, or `DOUBLE` columns: 0.
- Native `JSON` columns: 2.
- A second execution of the baseline completed successfully and retained 26 tables.

The isolated validation container was removed after these checks. The existing PostgreSQL development stack and its volumes were not modified.
