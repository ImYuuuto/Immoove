# Phase 2 database migration runbook

Do not run migration 014 on production until a restorable backup has been
created and verified in a separate database.

1. Stop writes or place the API in maintenance mode.
2. Set `DATABASE_URL` to the production database.
3. Run `scripts/backup-before-phase2.ps1` on a host with `pg_dump` installed.
4. Restore the generated custom-format dump into a temporary database with
   `pg_restore` and verify user, listing, booking, review, favourite, image, and
   audit counts.
5. Run `014-housing-role-location-normalization.sql` in one transaction.
6. Review suspended former moderator/staff accounts manually before activation.
7. Validate archived listings and property-type assignments before reopening writes.

If validation fails, stop writes and run
`src/migrations/rollback/014-housing-role-location-normalization.rollback.sql`.
The rollback uses the snapshot tables created by migration 014. Keep the
external dump until the production retention window has elapsed.

Normal application deployment must use `npm run migrate` or
`npm run migrate:node`. Both commands use `schema_migrations`, validate SHA-256
checksums, and serialize concurrent migration containers. Do not execute the
historical SQL files as a shell chain.
