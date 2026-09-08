const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  if (process.env.NODE_ENV === 'production') throw new Error('Development seed data cannot be loaded in production.');
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL must be set.');
  const url = new URL(process.env.DATABASE_URL);
  if (url.protocol !== 'mysql:') throw new Error('DATABASE_URL must use mysql://.');
  const connection = await mysql.createConnection({
    host: url.hostname, port: url.port ? Number.parseInt(url.port, 10) : 3306,
    user: decodeURIComponent(url.username), password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, '')), charset: 'utf8mb4',
    timezone: 'Z', multipleStatements: true,
  });
  try {
    const sql = fs.readFileSync(path.join(__dirname, '..', 'src', 'seeds', 'mysql-development.sql'), 'utf8');
    await connection.query(sql);
    console.log('MySQL development seed loaded.');
  } finally {
    await connection.end();
  }
}

run().catch((error) => { console.error(error); process.exitCode = 1; });
