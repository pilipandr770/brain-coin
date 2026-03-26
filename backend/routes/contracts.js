const router = require('express').Router();
const { pool } = require('../db');
const auth = require('../middleware/auth');

// ── List contracts for current user ──────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    let q, params;
    if (req.user.role === 'parent') {
      q = `SELECT c.*, s.name AS subject_name, s.emoji AS subject_emoji,
                  ch.name AS child_name, ch.avatar_emoji AS child_avatar
           FROM contracts c
           JOIN subjects s  ON s.id  = c.subject_id
           JOIN users    ch ON ch.id = c.child_id
           WHERE c.parent_id = $1
           ORDER BY c.created_at DESC`;
      params = [req.user.id];
    } else {
      q = `SELECT c.*, s.name AS subject_name, s.emoji AS subject_emoji,
                  p.name AS parent_name, p.avatar_emoji AS parent_avatar
           FROM contracts c
           JOIN subjects s ON s.id = c.subject_id
           JOIN users    p ON p.id = c.parent_id
           WHERE c.child_id = $1
           ORDER BY c.created_at DESC`;
      params = [req.user.id];
    }
    const { rows } = await pool.query(q, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// ── Create contract ───────────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  const {
    child_id, parent_id,
    subject_id, grade,
    title, description,
    prize_name, prize_emoji, prize_coins,
    points_per_correct, penalty_per_wrong, time_per_question,
    target_coins,
  } = req.body;

  try {
    let finalParentId, finalChildId;
    let childAccepted = false, parentAccepted = false;

    if (req.user.role === 'parent') {
      finalParentId = req.user.id;
      finalChildId  = child_id;
      parentAccepted = true;
    } else {
      finalChildId  = req.user.id;
      finalParentId = parent_id;
      childAccepted = true;
    }

    // Verify parent-child link exists
    const rel = await pool.query(
      "SELECT id FROM parent_child WHERE parent_id=$1 AND child_id=$2 AND status='accepted'",
      [finalParentId, finalChildId]
    );
    if (!rel.rows[0]) return res.status(403).json({ error: 'Keine bestätigte Eltern-Kind-Verbindung' });

    const { rows } = await pool.query(
      `INSERT INTO contracts
         (created_by, parent_id, child_id, subject_id, grade,
          title, description, prize_name, prize_emoji, prize_coins,
          points_per_correct, penalty_per_wrong, time_per_question,
          target_coins, child_accepted, parent_accepted, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'pending')
       RETURNING *`,
      [
        req.user.id, finalParentId, finalChildId, subject_id, grade,
        title, description || null,
        prize_name, prize_emoji || '🏆', prize_coins || 100,
        points_per_correct || 5, penalty_per_wrong || 2, time_per_question || 30,
        target_coins || prize_coins || 100,
        childAccepted, parentAccepted,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// ── Get one contract ──────────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*,
              s.name AS subject_name, s.emoji AS subject_emoji,
              p.name AS parent_name,  p.avatar_emoji AS parent_avatar,
              ch.name AS child_name,  ch.avatar_emoji AS child_avatar
       FROM contracts c
       JOIN subjects s  ON s.id  = c.subject_id
       JOIN users    p  ON p.id  = c.parent_id
       JOIN users    ch ON ch.id = c.child_id
       WHERE c.id = $1 AND (c.parent_id = $2 OR c.child_id = $2)`,
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Vertrag nicht gefunden' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// ── Accept contract ───────────────────────────────────────────────────────────
router.post('/:id/accept', auth, async (req, res) => {
  try {
    const cur = await pool.query('SELECT * FROM contracts WHERE id = $1', [req.params.id]);
    if (!cur.rows[0]) return res.status(404).json({ error: 'Vertrag nicht gefunden' });
    const c = cur.rows[0];

    if (req.user.role === 'child' && c.child_id === req.user.id) {
      await pool.query('UPDATE contracts SET child_accepted = true WHERE id = $1', [req.params.id]);
    } else if (req.user.role === 'parent' && c.parent_id === req.user.id) {
      await pool.query('UPDATE contracts SET parent_accepted = true WHERE id = $1', [req.params.id]);
    } else {
      return res.status(403).json({ error: 'Kein Zugriff' });
    }

    const updated = await pool.query('SELECT * FROM contracts WHERE id = $1', [req.params.id]);
    const u = updated.rows[0];
    if (u.child_accepted && u.parent_accepted && u.status === 'pending') {
      await pool.query("UPDATE contracts SET status = 'active' WHERE id = $1", [req.params.id]);
      u.status = 'active';
    }
    res.json(u);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// ── Reject contract ───────────────────────────────────────────────────────────
router.post('/:id/reject', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "UPDATE contracts SET status='rejected' WHERE id=$1 AND (parent_id=$2 OR child_id=$2) RETURNING *",
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Vertrag nicht gefunden' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Serverfehler' });
  }
});

module.exports = router;
