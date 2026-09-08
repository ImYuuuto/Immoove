const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const migrationDirectory = path.join(__dirname, '..', 'src', 'migrations', 'mysql');
const migrationFiles = fs.readdirSync(migrationDirectory).filter((file) => /^\d{3}-.*\.sql$/.test(file)).sort();
const lockName = 'immoove-schema-migrations';

function connectionOptions() {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error('DATABASE_URL must be set before running migrations.');
  const url = new URL(value);
  if (url.protocol !== 'mysql:') throw new Error('DATABASE_URL must use the mysql:// protocol.');
  return { host: url.hostname, port: url.port ? Number.parseInt(url.port, 10) : 3306,
    user: decodeURIComponent(url.username), password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, '')), charset: 'utf8mb4',
    timezone: 'Z', multipleStatements: true };
}

async function run() {
  const connection = await mysql.createConnection(connectionOptions());
  let locked = false;
  try {
    await connection.query("SET time_zone = '+00:00'");
    const [lockRows] = await connection.execute('SELECT GET_LOCK(?, 30) AS acquired', [lockName]);
    locked = lockRows[0]?.acquired === 1;
    if (!locked) throw new Error('Timed out waiting for the schema migration lock.');
    await connection.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) NOT NULL PRIMARY KEY,
      checksum CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
      applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);
    const [rows] = await connection.query('SELECT filename, checksum FROM schema_migrations');
    const applied = new Map(rows.map((row) => [row.filename, row.checksum]));
    for (const file of migrationFiles) {
      const sql = fs.readFileSync(path.join(migrationDirectory, file), 'utf8');
      const checksum = crypto.createHash('sha256').update(sql).digest('hex');
      if (applied.has(file)) {
        if (applied.get(file) !== checksum) throw new Error(`Applied migration was modified: ${file}`);
        continue;
      }
      await connection.query(sql);
      await connection.execute('INSERT INTO schema_migrations (filename, checksum) VALUES (?, ?)', [file, checksum]);
      console.log(`Applied ${file}.`);
    }
  } finally {
    if (locked) await connection.execute('SELECT RELEASE_LOCK(?)', [lockName]).catch(() => undefined);
    await connection.end();
  }
}

run().catch((error) => { console.error(error); process.exitCode = 1; });
