const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../db');
const auth = require('../middleware/auth');

const sign = (user) =>
  jwt.sign({ id: user.id, role: user.role, name: user.name }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

// ── Register ──────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, email, password, role, age, grade, ui_language } = req.body;
  if (!name || !email || !password || !role)
    return res.status(400).json({ error: 'Fill in all required fields' });
  if (!['parent', 'child'].includes(role))
    return res.status(400).json({ error: 'Invalid role' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const lang = ['uk', 'en', 'de'].includes(ui_language) ? ui_language : 'de';

  try {
    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, age, grade, ui_language)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, email, role, age, grade, ui_language, total_coins, avatar_emoji, content_settings`,
      [name.trim(), email.toLowerCase(), hash, role, age || null, grade || null, lang]
    );
    const user = rows[0];
    res.status(201).json({ token: sign(user), user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Login ─────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Введите email и пароль' });

  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [
      email.toLowerCase(),
    ]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Неверный email или пароль' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Неверный email или пароль' });

    const { password_hash, ...safe } = user;
    res.json({ token: sign(safe), user: safe });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ── Me ────────────────────────────────────────────────────────────────────────
router.get('/me', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, age, grade, ui_language, content_settings, total_coins, avatar_emoji, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Update UI language ────────────────────────────────────────────────────────
router.patch('/me/language', auth, async (req, res) => {
  const { ui_language } = req.body;
  if (!['uk', 'en', 'de'].includes(ui_language))
    return res.status(400).json({ error: 'Invalid language code' });
  try {
    await pool.query('UPDATE users SET ui_language = $1 WHERE id = $2', [ui_language, req.user.id]);
    res.json({ ui_language });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Update avatar emoji ───────────────────────────────────────────────────────
router.patch('/me/avatar', auth, async (req, res) => {
  const { avatar_emoji } = req.body;
  if (!avatar_emoji) return res.status(400).json({ error: 'Provide emoji' });
  try {
    await pool.query('UPDATE users SET avatar_emoji = $1 WHERE id = $2', [avatar_emoji, req.user.id]);
    res.json({ avatar_emoji });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Parent: get/set content settings for a child ─────────────────────────────
router.get('/children/:childId/settings', auth, async (req, res) => {
  if (req.user.role !== 'parent') return res.status(403).json({ error: 'Parents only' });
  const childId = parseInt(req.params.childId);
  try {
    // Verify relationship
    const rel = await pool.query(
      "SELECT id FROM parent_child WHERE parent_id=$1 AND child_id=$2 AND status='accepted'",
      [req.user.id, childId]
    );
    if (!rel.rows[0]) return res.status(404).json({ error: 'Child not found' });
    const { rows } = await pool.query(
      'SELECT content_settings FROM users WHERE id=$1',
      [childId]
    );
    res.json(rows[0]?.content_settings || {});
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/children/:childId/settings', auth, async (req, res) => {
  if (req.user.role !== 'parent') return res.status(403).json({ error: 'Parents only' });
  const childId = parseInt(req.params.childId);
  const { block_religion, block_politics, block_conflicts, block_mature, safe_mode } = req.body;
  const settings = {
    block_religion:  !!block_religion,
    block_politics:  !!block_politics,
    block_conflicts: !!block_conflicts,
    block_mature:    !!block_mature,
    safe_mode:       !!safe_mode,
  };
  try {
    const rel = await pool.query(
      "SELECT id FROM parent_child WHERE parent_id=$1 AND child_id=$2 AND status='accepted'",
      [req.user.id, childId]
    );
    if (!rel.rows[0]) return res.status(404).json({ error: 'Child not found' });
    await pool.query('UPDATE users SET content_settings=$1 WHERE id=$2', [settings, childId]);
    res.json(settings);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Generate invite code ──────────────────────────────────────────────────────
router.post('/invite/generate', auth, async (req, res) => {
  try {
    // Invalidate old unused codes by this user
    await pool.query(
      "DELETE FROM invite_codes WHERE created_by = $1 AND used_by IS NULL AND expires_at > NOW()",
      [req.user.id]
    );
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO invite_codes (code, created_by, expires_at) VALUES ($1, $2, $3)',
      [code, req.user.id, expiresAt]
    );
    res.json({ code, expiresAt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ── Accept invite code (link parent ↔ child) ─────────────────────────────────
router.post('/invite/accept', auth, async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Введите код приглашения' });

  try {
    const inv = await pool.query(
      "SELECT * FROM invite_codes WHERE code = $1 AND used_by IS NULL AND expires_at > NOW()",
      [code.toUpperCase()]
    );
    if (!inv.rows[0]) return res.status(404).json({ error: 'Код не найден или истёк' });

    const invite = inv.rows[0];
    if (invite.created_by === req.user.id)
      return res.status(400).json({ error: 'Нельзя использовать свой код' });

    const inviter = await pool.query('SELECT role FROM users WHERE id = $1', [invite.created_by]);
    const inviterRole = inviter.rows[0].role;
    const myRole = req.user.role;

    let parentId, childId;
    if (inviterRole === 'parent' && myRole === 'child') {
      parentId = invite.created_by;
      childId = req.user.id;
    } else if (inviterRole === 'child' && myRole === 'parent') {
      parentId = req.user.id;
      childId = invite.created_by;
    } else {
      return res.status(400).json({ error: 'Код должен быть использован противоположной ролью' });
    }

    await pool.query(
      "INSERT INTO parent_child (parent_id, child_id, status) VALUES ($1, $2, 'accepted') ON CONFLICT DO NOTHING",
      [parentId, childId]
    );
    await pool.query('UPDATE invite_codes SET used_by = $1 WHERE id = $2', [
      req.user.id,
      invite.id,
    ]);

    // Return linked user info
    const linked = await pool.query(
      'SELECT id, name, role, avatar_emoji FROM users WHERE id = $1',
      [invite.created_by]
    );
    res.json({ message: 'Связь установлена!', linkedUser: linked.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ── Get children for parent ───────────────────────────────────────────────────
router.get('/children', auth, async (req, res) => {
  if (req.user.role !== 'parent') return res.status(403).json({ error: 'Только для родителей' });
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.age, u.total_coins, u.avatar_emoji,
              (SELECT COUNT(*) FROM contracts WHERE child_id = u.id AND status = 'active') AS active_contracts
       FROM users u
       JOIN parent_child pc ON pc.child_id = u.id
       WHERE pc.parent_id = $1 AND pc.status = 'accepted'
       ORDER BY u.name`,
      [req.user.id]
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ── Get parents for child ─────────────────────────────────────────────────────
router.get('/parents', auth, async (req, res) => {
  if (req.user.role !== 'child') return res.status(403).json({ error: 'Только для детей' });
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.avatar_emoji
       FROM users u
       JOIN parent_child pc ON pc.parent_id = u.id
       WHERE pc.child_id = $1 AND pc.status = 'accepted'`,
      [req.user.id]
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ── Parent creates child account ──────────────────────────────────────────────
router.post('/children', auth, async (req, res) => {
  if (req.user.role !== 'parent') return res.status(403).json({ error: 'Только для родителей' });
  const { name, email, password, age } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Заполните все поля' });
  if (password.length < 6) return res.status(400).json({ error: 'Пароль не менее 6 символов' });

  try {
    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (exists.rows.length) return res.status(409).json({ error: 'Email уже используется' });

    const hash = await bcrypt.hash(password, 12);
    const child = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, age)
       VALUES ($1, $2, $3, 'child', $4)
       RETURNING id, name, email, role, age, total_coins, avatar_emoji`,
      [name.trim(), email.toLowerCase(), hash, age || null]
    );
    await pool.query(
      "INSERT INTO parent_child (parent_id, child_id, status) VALUES ($1, $2, 'accepted')",
      [req.user.id, child.rows[0].id]
    );
    res.status(201).json(child.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
