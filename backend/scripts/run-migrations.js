const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

const baselineFile = '001-immoove-baseline.sql';
const baselinePath = path.join(__dirname, '..', 'src', 'migrations', baselineFile);
const baselineSql = fs.readFileSync(baselinePath, 'utf8');
const baselineChecksum = crypto.createHash('sha256').update(baselineSql).digest('hex');

async function validateImmooveSchema(client) {
  const result = await client.query(`SELECT
    to_regclass('public.users') IS NOT NULL AS has_users,
    to_regclass('public.listings') IS NOT NULL AS has_listings,
    to_regclass('public.announcement_requests') IS NOT NULL AS has_requests,
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'listings' AND column_name = 'rental_term'
    ) AS has_rental_term,
    EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'announcement_requests' AND column_name = 'property_type_id'
    ) AS has_request_property_type`);
  const state = result.rows[0];
  if (!Object.values(state).every(Boolean)) {
    throw new Error(
      'The existing database does not match the consolidated Immoove schema. Restore the cleanup baseline backup before continuing.',
    );
  }
}

async function recordBaseline(client) {
  await client.query('DELETE FROM schema_migrations');
  await client.query(
    'INSERT INTO schema_migrations (filename, checksum) VALUES ($1, $2)',
    [baselineFile, baselineChecksum],
  );
}

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query("SELECT pg_advisory_lock(hashtext('immoove-schema-migrations'))");
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      filename text PRIMARY KEY,
      checksum text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`);

    const applied = await client.query('SELECT filename, checksum FROM schema_migrations ORDER BY filename');
    const baseline = applied.rows.find((row) => row.filename === baselineFile);
    if (baseline) {
      if (baseline.checksum !== baselineChecksum) {
        throw new Error(`Applied migration was modified: ${baselineFile}`);
      }
      return;
    }

    const schemaState = await client.query("SELECT to_regclass('public.users') IS NOT NULL AS exists");
    await client.query('BEGIN');
    try {
      if (schemaState.rows[0].exists) {
        await validateImmooveSchema(client);
        await recordBaseline(client);
        console.log(`Consolidated ${applied.rowCount} legacy migration records into ${baselineFile}.`);
      } else {
        await client.query(baselineSql);
        await recordBaseline(client);
        console.log(`Applied ${baselineFile}.`);
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  } finally {
    await client.query("SELECT pg_advisory_unlock(hashtext('immoove-schema-migrations'))").catch(() => undefined);
    await client.end();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
