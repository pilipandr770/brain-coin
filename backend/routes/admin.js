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
const genJob   = require('../services/genJob');

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
              sub_status, sub_current_period_end,
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
         COUNT(*) FILTER (WHERE sub_status = 'active')     AS active_subscriptions,
         COUNT(*) FILTER (WHERE sub_status = 'trialing')   AS trialing_subscriptions,
         COUNT(*) FILTER (WHERE sub_status = 'past_due')   AS past_due_subscriptions,
         COUNT(*) FILTER (WHERE sub_status = 'canceled')   AS canceled_count
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
// Body: { sub_status: 'active' | 'trialing' | 'canceled' | 'none' }
router.patch('/users/:id/subscription', auth, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { sub_status } = req.body;

  const allowed = ['none', 'trialing', 'active', 'past_due', 'canceled'];
  if (!allowed.includes(sub_status)) {
    return res.status(400).json({ error: `sub_status must be one of: ${allowed.join(', ')}` });
  }

  try {
    const { rowCount } = await pool.query(
      'UPDATE users SET sub_status = $1 WHERE id = $2',
      [sub_status, id]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, sub_status });
  } catch (err) {
    console.error('Admin toggle subscription error:', err);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

// ── Subject management ────────────────────────────────────────────────────────

// GET /api/admin/subjects — list all subjects
router.get('/subjects', auth, adminOnly, async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM subjects ORDER BY name');
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// POST /api/admin/subjects — create new subject
router.post('/subjects', auth, adminOnly, async (req, res) => {
  const { name, name_en, slug, emoji, grades } = req.body;
  if (!name || !slug) return res.status(400).json({ error: 'name und slug erforderlich' });

  // Sanitize slug: lowercase, only a-z and hyphens
  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');

  try {
    const { rows } = await pool.query(
      `INSERT INTO subjects (name, name_en, name_de, slug, emoji, grades)
       VALUES ($1, $2, $1, $3, $4, $5) RETURNING *`,
      [name, name_en || name, cleanSlug, emoji || '📚', grades || ['4','5','6','7','8','9']]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Slug bereits vergeben' });
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// PATCH /api/admin/subjects/:id — update subject
router.patch('/subjects/:id', auth, adminOnly, async (req, res) => {
  const { name, name_en, emoji, grades } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE subjects SET
         name    = COALESCE($1, name),
         name_en = COALESCE($2, name_en),
         name_de = COALESCE($1, name_de),
         emoji   = COALESCE($3, emoji),
         grades  = COALESCE($4, grades)
       WHERE id = $5 RETURNING *`,
      [name, name_en, emoji, grades, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Nicht gefunden' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// DELETE /api/admin/subjects/:id — delete subject (only if no questions/contracts)
router.delete('/subjects/:id', auth, adminOnly, async (req, res) => {
  try {
    const { rows: check } = await pool.query(
      'SELECT COUNT(*) AS cnt FROM questions WHERE subject_id=$1',
      [req.params.id]
    );
    if (parseInt(check[0].cnt) > 0)
      return res.status(409).json({ error: `Hat noch ${check[0].cnt} Fragen — zuerst Fragen löschen` });

    await pool.query('DELETE FROM subjects WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// ── AI Generation Control ────────────────────────────────────────────────────

// GET /api/admin/gen/status — job state + lifetime cost stats
router.get('/gen/status', auth, adminOnly, async (_req, res) => {
  try {
    res.json(await genJob.getStatus());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/gen/start — kick off background generation
router.post('/gen/start', auth, adminOnly, (_req, res) => {
  const started = genJob.startJob();
  res.json({ started, alreadyRunning: !started });
});

// POST /api/admin/gen/stop — signal the job to stop after current task
router.post('/gen/stop', auth, adminOnly, (_req, res) => {
  genJob.stopJob();
  res.json({ stopped: true });
});

// GET /api/admin/gen/pool — question counts per subject+grade
router.get('/gen/pool', auth, adminOnly, async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT s.name AS subject, s.slug, q.grade, COUNT(*)::int AS count
       FROM questions q
       JOIN subjects s ON s.id = q.subject_id
       GROUP BY s.name, s.slug, q.grade
       ORDER BY s.name, q.grade`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
