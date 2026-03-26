const router = require('express').Router();
const { pool } = require('../db');
const auth = require('../middleware/auth');

// ── Global leaderboard (children only) ───────────────────────────────────────
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.total_coins, u.avatar_emoji,
              COUNT(DISTINCT CASE WHEN c.status='completed' THEN c.id END) AS completed_quests,
              COALESCE(SUM(CASE WHEN qs.completed_at IS NOT NULL THEN qs.correct_count END),0) AS total_correct
       FROM users u
       LEFT JOIN contracts    c  ON c.child_id  = u.id
       LEFT JOIN quiz_sessions qs ON qs.child_id = u.id
       WHERE u.role = 'child'
       GROUP BY u.id
       ORDER BY u.total_coins DESC
       LIMIT 100`
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// ── List friends / requests ───────────────────────────────────────────────────
router.get('/friends', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT f.id, f.status, f.created_at, f.requester_id,
              CASE WHEN f.requester_id=$1 THEN f.addressee_id ELSE f.requester_id END AS friend_id,
              u.name AS friend_name, u.avatar_emoji AS friend_avatar, u.total_coins AS friend_coins
       FROM friendships f
       JOIN users u ON u.id = CASE WHEN f.requester_id=$1 THEN f.addressee_id ELSE f.requester_id END
       WHERE f.requester_id=$1 OR f.addressee_id=$1
       ORDER BY f.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// ── Send friend request ───────────────────────────────────────────────────────
router.post('/friends/request', auth, async (req, res) => {
  const { addressee_id } = req.body;
  if (!addressee_id || addressee_id === req.user.id)
    return res.status(400).json({ error: 'Ungültige Anfrage' });

  try {
    const target = await pool.query(
      "SELECT id, role FROM users WHERE id=$1 AND role='child'",
      [addressee_id]
    );
    if (!target.rows[0]) return res.status(404).json({ error: 'Spieler nicht gefunden' });

    const dup = await pool.query(
      'SELECT id FROM friendships WHERE (requester_id=$1 AND addressee_id=$2) OR (requester_id=$2 AND addressee_id=$1)',
      [req.user.id, addressee_id]
    );
    if (dup.rows[0]) return res.status(409).json({ error: 'Anfrage existiert bereits' });

    const { rows } = await pool.query(
      'INSERT INTO friendships (requester_id, addressee_id) VALUES ($1,$2) RETURNING *',
      [req.user.id, addressee_id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// ── Accept / reject friend request ───────────────────────────────────────────
router.put('/friends/:id', auth, async (req, res) => {
  const { action } = req.body;
  if (!['accept', 'reject'].includes(action))
    return res.status(400).json({ error: 'action muss accept oder reject sein' });

  try {
    const newStatus = action === 'accept' ? 'accepted' : 'rejected';
    const { rows } = await pool.query(
      "UPDATE friendships SET status=$1 WHERE id=$2 AND addressee_id=$3 AND status='pending' RETURNING *",
      [newStatus, req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Anfrage nicht gefunden' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// ── Get messages with a friend (requires accepted friendship) ─────────────────
router.get('/messages/:friendId', auth, async (req, res) => {
  const friendId = parseInt(req.params.friendId);
  try {
    const ok = await pool.query(
      "SELECT id FROM friendships WHERE ((requester_id=$1 AND addressee_id=$2) OR (requester_id=$2 AND addressee_id=$1)) AND status='accepted'",
      [req.user.id, friendId]
    );
    if (!ok.rows[0]) return res.status(403).json({ error: 'Kein Zugriff' });

    const { rows } = await pool.query(
      `SELECT m.*, u.name AS sender_name, u.avatar_emoji AS sender_avatar
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE (m.sender_id=$1 AND m.receiver_id=$2) OR (m.sender_id=$2 AND m.receiver_id=$1)
       ORDER BY m.created_at ASC
       LIMIT 200`,
      [req.user.id, friendId]
    );

    // Mark incoming as read
    await pool.query(
      'UPDATE messages SET is_read=true WHERE sender_id=$1 AND receiver_id=$2 AND is_read=false',
      [friendId, req.user.id]
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// ── Send message ──────────────────────────────────────────────────────────────
router.post('/messages', auth, async (req, res) => {
  const { receiver_id, content } = req.body;
  if (!receiver_id || !content?.trim())
    return res.status(400).json({ error: 'Nachricht eingeben' });
  if (content.length > 1000)
    return res.status(400).json({ error: 'Nachricht zu lang' });

  try {
    const ok = await pool.query(
      "SELECT id FROM friendships WHERE ((requester_id=$1 AND addressee_id=$2) OR (requester_id=$2 AND addressee_id=$1)) AND status='accepted'",
      [req.user.id, receiver_id]
    );
    if (!ok.rows[0]) return res.status(403).json({ error: 'Kein Zugriff' });

    const { rows } = await pool.query(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1,$2,$3) RETURNING *',
      [req.user.id, receiver_id, content.trim()]
    );
    res.status(201).json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Serverfehler' });
  }
});

module.exports = router;
