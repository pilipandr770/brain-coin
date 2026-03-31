require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');
const path      = require('path');
const fs        = require('fs');
const { pool }  = require('./db');

const app = express();

// ── Security headers (OWASP A05) ─────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));

// ── Serve static files FIRST — before CORS, before everything ────────────────
// Static assets are public; CORS must not block them.
if (process.env.NODE_ENV === 'production') {
  const publicDir = path.join(__dirname, 'public');
  const publicExists = fs.existsSync(publicDir);
  console.log(`Static dir ${publicDir}: ${publicExists ? 'OK' : 'NOT FOUND'}`);
  if (publicExists) {
    app.use(express.static(publicDir, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
        } else if (/\.(js|css|woff2?|ttf|eot|png|jpg|jpeg|gif|svg|ico|webp)$/.test(filePath)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    }));
  }
}

// ── CORS — applied only to /api routes (frontend is same-origin) ──────────────
const allowedOrigins = new Set(
  [
    process.env.CORS_ORIGIN   || '',
    process.env.FRONTEND_URL  || '',
    'http://localhost:5173',
    'http://localhost:3000',
  ]
  .flatMap(o => o.split(','))
  .map(o => o.trim())
  .filter(Boolean)
);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // mobile app / same-origin requests
    if (allowedOrigins.has(origin)) return callback(null, true);
    // Log but don't crash — helps debug without breaking static assets
    console.warn(`CORS blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

app.use('/api', cors(corsOptions));

// ── Rate limiting (OWASP A07) ─────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: 'Zu viele Anmeldeversuche. Bitte warte 15 Minuten.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { error: 'Zu viele Registrierungen. Bitte versuche es in einer Stunde erneut.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const inviteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Zu viele Versuche. Bitte warte 15 Minuten.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/login',          loginLimiter);
app.use('/api/auth/register',       registerLimiter);
app.use('/api/auth/invite/accept',  inviteLimiter);

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
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.sendFile(f, err => { if (err) next(err); });
  });
}

// Auto-run DB migrations on every startup (all files are idempotent)
async function runMigrations() {
  const files = ['schema.sql', 'migrate_subscription.sql', 'seed.sql', 'migrate_gen.sql', 'migrate_topics.sql', 'migrate_fix_local_gen.sql'];
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
