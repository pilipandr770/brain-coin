const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('FATAL: DATABASE_URL is not set. Check your .env or docker-compose.yml');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Ensure schema isolation on shared Render PostgreSQL.
  // search_path may also be set via ?options=-csearch_path%3Dbraincoin in the URL.
  options: '-c search_path=braincoin',
});

pool.on('error', (err) => console.error('PostgreSQL pool error:', err));

module.exports = { pool };
