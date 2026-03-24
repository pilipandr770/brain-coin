/**
 * Admin routes — accessible only to users with role = 'admin'
 *
 * GET   /api/admin/users                      → list all users
 * GET   /api/admin/stats                      → aggregated stats
 * PATCH /api/admin/users/:id/subscription     → manually set subscription status
 */
const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const { pool } = require('../db');

// ─── Admin guard middleware ────────────────────────────────────────────────
async function adminOnly(req, res, next) {
  try {
    const { rows } = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [req.user.id]
    );
    if (rows[0]?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (err) {
    next(err);
  }
}

// ─── User list ─────────────────────────────────────────────────────────────
router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, role,
              subscription_status, subscription_end,
              created_at
       FROM users
       ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ─── Stats ─────────────────────────────────────────────────────────────────
router.get('/stats', auth, adminOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         COUNT(*)                                                    AS total_users,
         COUNT(*) FILTER (WHERE role = 'parent')                    AS total_parents,
         COUNT(*) FILTER (WHERE role = 'child')                     AS total_children,
         COUNT(*) FILTER (WHERE subscription_status = 'active')     AS active_subscriptions,
         COUNT(*) FILTER (WHERE subscription_status = 'trial')      AS trialing_subscriptions,
         COUNT(*) FILTER (WHERE subscription_status = 'past_due')   AS past_due_subscriptions,
         COUNT(*) FILTER (WHERE subscription_status = 'canceled')   AS canceled_count
       FROM users`
    );
    const stats = rows[0];
    stats.estimated_mrr_eur = Number(stats.active_subscriptions) * 5;
    res.json(stats);
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ─── Manual subscription override ─────────────────────────────────────────
// Body: { subscription_status: 'active' | 'trial' | 'canceled' | 'none' }
router.patch('/users/:id/subscription', auth, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { subscription_status } = req.body;

  const allowed = ['none', 'trial', 'active', 'past_due', 'canceled'];
  if (!allowed.includes(subscription_status)) {
    return res.status(400).json({ error: `subscription_status must be one of: ${allowed.join(', ')}` });
  }

  try {
    const { rowCount } = await pool.query(
      'UPDATE users SET subscription_status = $1 WHERE id = $2',
      [subscription_status, id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, subscription_status });
  } catch (err) {
    console.error('Admin toggle subscription error:', err);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

module.exports = router;
