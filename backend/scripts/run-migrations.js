const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

const migrationFiles = [
  '001-create-schema.sql',
  '002-seed-data.sql',
  '003-platform-features.sql',
  '004-reset-dev-admin-password.sql',
  '005-add-session-version.sql',
  '006-profile-ownership.sql',
  '007-booking-contact.sql',
  '008-listing-categories.sql',
  '009-localize-seed-images.sql',
  '010-staff-dashboards.sql',
  '011-category-sample-listings.sql',
  '012-publication-moderation.sql',
  '013-query-indexes.sql',
  '014-housing-role-location-normalization.sql',
  '015-legal-consent.sql',
  '016-morocco-wide-rebrand.sql',
];

const migrationDirectory = path.join(__dirname, '..', 'src', 'migrations');
const readMigration = (file) => fs.readFileSync(path.join(migrationDirectory, file), 'utf8');
const checksum = (sql) => crypto.createHash('sha256').update(sql).digest('hex');

async function baselineLegacyDatabase(client) {
  const state = await client.query(`SELECT
    to_regclass('public.users') IS NOT NULL AS has_users,
    to_regclass('public.announcement_request_images') IS NOT NULL AS has_upload_schema,
    to_regclass('public.listings_description_trgm_idx') IS NOT NULL AS has_phase_one_indexes`);
  const row = state.rows[0];
  if (!row.has_users) return;
  if (!row.has_upload_schema || !row.has_phase_one_indexes) {
    throw new Error(
      'Existing database has no migration ledger and does not match the Phase 1 schema. ' +
      'Back it up and baseline it manually; historical migrations will not be replayed.',
    );
  }

  for (const file of migrationFiles.slice(0, 13)) {
    const sql = readMigration(file);
    await client.query(
      'INSERT INTO schema_migrations (filename, checksum) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [file, checksum(sql)],
    );
  }
  console.log('Baselined existing Phase 1 database through migration 013.');
}

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query("SELECT pg_advisory_lock(hashtext('sidibouzid-schema-migrations'))");
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      filename text PRIMARY KEY,
      checksum text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`);
    const appliedCount = await client.query('SELECT count(*)::int AS count FROM schema_migrations');
    if (appliedCount.rows[0].count === 0) {
      await client.query('BEGIN');
      try {
        await baselineLegacyDatabase(client);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }

    for (const file of migrationFiles) {
      const sql = readMigration(file);
      const digest = checksum(sql);
      const applied = await client.query(
        'SELECT checksum FROM schema_migrations WHERE filename = $1',
        [file],
      );
      if (applied.rows[0]) {
        if (applied.rows[0].checksum !== digest)
          throw new Error(`Applied migration was modified: ${file}`);
        continue;
      }

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (filename, checksum) VALUES ($1, $2)',
          [file, digest],
        );
        await client.query('COMMIT');
        console.log(`Applied ${file}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    await client.query("SELECT pg_advisory_unlock(hashtext('sidibouzid-schema-migrations'))").catch(() => undefined);
    await client.end();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
