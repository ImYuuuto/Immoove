const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();
(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    for (const file of [
      '001-create-schema.sql',
      '002-seed-data.sql',
      '003-platform-features.sql',
      '004-reset-dev-admin-password.sql',
    ])
      await client.query(
        fs.readFileSync(
          path.join(__dirname, '..', 'src', 'migrations', file),
          'utf8',
        ),
      );
  } finally {
    await client.end();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
