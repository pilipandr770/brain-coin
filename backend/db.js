const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('FATAL: DATABASE_URL is not set. Check your .env or docker-compose.yml');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  options: '-c search_path=braincoin',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => console.error('PostgreSQL pool error:', err));

module.exports = { pool };
