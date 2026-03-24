require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool } = require('./db');

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`BrainCoin API → http://localhost:${PORT}`));
