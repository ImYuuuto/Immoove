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
