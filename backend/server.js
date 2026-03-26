require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
const { pool } = require('./db');

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Stripe webhook needs raw body — must be mounted BEFORE express.json()
app.use('/api/payments/webhook', require('./routes/payments'));

app.use(express.json());

app.use('/api/auth',      require('./routes/auth'));
app.use('/api/contracts', require('./routes/contracts'));
app.use('/api/quiz',      require('./routes/quiz'));
app.use('/api/social',    require('./routes/social'));
app.use('/api/payments',  require('./routes/payments'));
app.use('/api/admin',     require('./routes/admin'));

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', timestamp: new Date() });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Production: serve the built React app from backend/public/
// The frontend build is copied here during the Render build step.
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
  // SPA fallback — all non-API routes serve index.html
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

// Auto-run DB migrations on every startup (all files are idempotent)
async function runMigrations() {
  const files = ['schema.sql', 'migrate_subscription.sql', 'seed.sql'];
  for (const file of files) {
    try {
      const sql = fs.readFileSync(path.join(__dirname, 'db', file), 'utf8');
      await pool.query(sql);
      console.log(`✓ migration: ${file}`);
    } catch (err) {
      console.error(`✗ migration ${file}:`, err.message);
    }
  }
}

const PORT = process.env.PORT || 3001;
runMigrations().then(() => {
  app.listen(PORT, () => console.log(`BrainCoin API → http://localhost:${PORT}`));
});
