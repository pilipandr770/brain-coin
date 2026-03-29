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

// ─────────────────────────── CHALLENGES ───────────────────────────────────────

// GET  /social/challenges  — list all my challenges (incoming + outgoing)
router.get('/challenges', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*,
              sub.name AS subject_name, sub.emoji AS subject_emoji,
              u1.name  AS challenger_name, u1.avatar_emoji AS challenger_avatar,
              u2.name  AS challenged_name, u2.avatar_emoji AS challenged_avatar
       FROM challenges c
       JOIN subjects sub ON sub.id = c.subject_id
       JOIN users u1 ON u1.id = c.challenger_id
       JOIN users u2 ON u2.id = c.challenged_id
       WHERE c.challenger_id=$1 OR c.challenged_id=$1
       ORDER BY c.created_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// POST /social/challenges  — send a challenge {friend_id, subject_id, grade}
router.post('/challenges', auth, async (req, res) => {
  const { friend_id, subject_id, grade } = req.body;
  if (!friend_id || !subject_id || !grade)
    return res.status(400).json({ error: 'friend_id, subject_id und grade erforderlich' });

  try {
    // Must be accepted friends
    const fr = await pool.query(
      "SELECT id FROM friendships WHERE ((requester_id=$1 AND addressee_id=$2) OR (requester_id=$2 AND addressee_id=$1)) AND status='accepted'",
      [req.user.id, friend_id]
    );
    if (!fr.rows[0]) return res.status(403).json({ error: 'Nur bei Freunden möglich' });

    // No active/pending challenge between these two for same subject+grade
    const dup = await pool.query(
      "SELECT id FROM challenges WHERE ((challenger_id=$1 AND challenged_id=$2) OR (challenger_id=$2 AND challenged_id=$1)) AND subject_id=$3 AND grade=$4 AND status IN ('pending','active')",
      [req.user.id, friend_id, subject_id, grade]
    );
    if (dup.rows[0]) return res.status(409).json({ error: 'Es gibt bereits eine aktive Herausforderung für dieses Fach' });

    // Pick 5 random questions from pool
    const qRes = await pool.query(
      'SELECT id FROM questions WHERE subject_id=$1 AND grade=$2 ORDER BY RANDOM() LIMIT 5',
      [subject_id, grade]
    );
    if (qRes.rows.length < 5)
      return res.status(422).json({ error: 'Nicht genug Fragen für dieses Fach/Klasse vorhanden' });

    const questionIds = qRes.rows.map(r => r.id);
    const { rows } = await pool.query(
      'INSERT INTO challenges (challenger_id, challenged_id, subject_id, grade, question_ids) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.user.id, friend_id, subject_id, grade, JSON.stringify(questionIds)]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// POST /social/challenges/:id/accept  — accept a challenge (challenged only)
router.post('/challenges/:id/accept', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "UPDATE challenges SET status='active' WHERE id=$1 AND challenged_id=$2 AND status='pending' RETURNING *",
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Herausforderung nicht gefunden' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// POST /social/challenges/:id/reject  — reject a challenge (challenged only)
router.post('/challenges/:id/reject', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "UPDATE challenges SET status='rejected' WHERE id=$1 AND challenged_id=$2 AND status='pending' RETURNING *",
      [req.params.id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Herausforderung nicht gefunden' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// GET  /social/challenges/:id/questions  — get the 5 questions (active challenge players only)
router.get('/challenges/:id/questions', auth, async (req, res) => {
  try {
    const cr = await pool.query(
      "SELECT * FROM challenges WHERE id=$1 AND (challenger_id=$2 OR challenged_id=$2) AND status='active'",
      [req.params.id, req.user.id]
    );
    const ch = cr.rows[0];
    if (!ch) return res.status(404).json({ error: 'Herausforderung nicht gefunden oder nicht aktiv' });

    // Check this user hasn't already submitted their score
    const isChallenger = ch.challenger_id === req.user.id;
    if (isChallenger && ch.challenger_score !== null)
      return res.status(409).json({ error: 'Du hast diese Herausforderung bereits abgeschlossen' });
    if (!isChallenger && ch.challenged_score !== null)
      return res.status(409).json({ error: 'Du hast diese Herausforderung bereits abgeschlossen' });

    const ids = ch.question_ids; // already parsed by pg JSONB
    const { rows } = await pool.query(
      'SELECT id, text AS question_text, answers AS options, correct_index AS correct_answer FROM questions WHERE id = ANY($1)',
      [ids]
    );
    // Return in the order stored in question_ids
    const ordered = ids.map(id => rows.find(r => r.id === id)).filter(Boolean);
    res.json(ordered);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// POST /social/challenges/:id/score  — submit score {score: 0-5}
router.post('/challenges/:id/score', auth, async (req, res) => {
  const score = parseInt(req.body.score, 10);
  if (isNaN(score) || score < 0 || score > 5)
    return res.status(400).json({ error: 'score muss zwischen 0 und 5 liegen' });

  try {
    const cr = await pool.query(
      "SELECT * FROM challenges WHERE id=$1 AND (challenger_id=$2 OR challenged_id=$2) AND status='active'",
      [req.params.id, req.user.id]
    );
    const ch = cr.rows[0];
    if (!ch) return res.status(404).json({ error: 'Herausforderung nicht gefunden' });

    const isChallenger = ch.challenger_id === req.user.id;
    const scoreCol     = isChallenger ? 'challenger_score' : 'challenged_score';
    const otherScore   = isChallenger ? ch.challenged_score : ch.challenger_score;

    // Don't allow double submission
    if (isChallenger && ch.challenger_score !== null)
      return res.status(409).json({ error: 'Bereits eingereicht' });
    if (!isChallenger && ch.challenged_score !== null)
      return res.status(409).json({ error: 'Bereits eingereicht' });

    const newStatus = otherScore !== null ? 'done' : 'active';
    const { rows } = await pool.query(
      `UPDATE challenges SET ${scoreCol}=$1, status=$2 WHERE id=$3 RETURNING *`,
      [score, newStatus, ch.id]
    );

    // Award winner 10 coins if both have submitted
    if (newStatus === 'done') {
      const updated = rows[0];
      const winnerId = updated.challenger_score > updated.challenged_score
        ? updated.challenger_id
        : updated.challenged_score > updated.challenger_score
          ? updated.challenged_id
          : null; // tie

      if (winnerId) {
        await pool.query(
          "UPDATE users SET total_coins=total_coins+10 WHERE id=$1",
          [winnerId]
        );
        await pool.query(
          "INSERT INTO coin_transactions (user_id, amount, description, type) VALUES ($1,10,'Herausforderung gewonnen 🏆','bonus')",
          [winnerId]
        );
      }
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

module.exports = router;
