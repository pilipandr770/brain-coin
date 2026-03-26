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
    if (!origin) return callback(null, true); // non-browser / same-origin requests
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // In production also allow any *.onrender.com subdomain (covers service URL)
    if (process.env.NODE_ENV === 'production' && /\.onrender\.com$/.test(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Production: serve the built React app from backend/public/
// Must be BEFORE API routes so assets are served directly without going
// through Express JSON / auth middleware.
if (process.env.NODE_ENV === 'production') {
  const publicDir = path.join(__dirname, 'public');
  const publicExists = fs.existsSync(publicDir);
  console.log(`Static dir ${publicDir}: ${publicExists ? 'OK' : 'NOT FOUND'}`);
  if (publicExists) app.use(express.static(publicDir));
}

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

// SPA fallback — must be AFTER all API routes, ONLY in production
// Serves index.html for any non-API route so React Router works
if (process.env.NODE_ENV === 'production') {
  app.get('*', (_req, res, next) => {
    const f = path.join(__dirname, 'public', 'index.html');
    res.sendFile(f, err => { if (err) next(err); });
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
