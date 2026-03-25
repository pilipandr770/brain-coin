const router = require('express').Router();
const { pool } = require('../db');
const auth = require('../middleware/auth');
const { ensureAndPickQuestions } = require('../services/questionGenerator');

// ── Get all subjects ──────────────────────────────────────────────────────────
router.get('/subjects', auth, async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, name, name_en, name_de, slug, emoji, grades FROM subjects ORDER BY name');
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Preview questions for a subject + grade (no session) ─────────────────────
router.get('/questions', auth, async (req, res) => {
  const { subject_id, grade, limit = 10 } = req.query;
  if (!subject_id || !grade) return res.status(400).json({ error: 'Укажите предмет и класс' });
  try {
    const { rows } = await pool.query(
      'SELECT id, text, answers, difficulty FROM questions WHERE subject_id=$1 AND grade=$2 ORDER BY RANDOM() LIMIT $3',
      [subject_id, grade, Math.min(parseInt(limit), 30)]
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ── Start a quiz session ──────────────────────────────────────────────────────
router.post('/sessions', auth, async (req, res) => {
  const { contract_id } = req.body;
  if (!contract_id) return res.status(400).json({ error: 'Укажите контракт' });

  try {
    const { rows: cr } = await pool.query(
      `SELECT c.*, s.name AS subject_name, s.emoji AS subject_emoji
       FROM contracts c
       JOIN subjects s ON s.id = c.subject_id
       WHERE c.id=$1 AND c.child_id=$2 AND c.status='active'`,
      [contract_id, req.user.id]
    );
    if (!cr[0]) return res.status(404).json({ error: 'Contract not found or inactive' });
    const contract = cr[0];

    // Fetch child's content settings (set by parent)
    const { rows: userRow } = await pool.query(
      'SELECT content_settings FROM users WHERE id=$1',
      [req.user.id]
    );
    const contentSettings = userRow[0]?.content_settings || {};

    // ── AI-assisted question pool: generate via Claude if pool is thin, cache in DB ──
    const qs = await ensureAndPickQuestions(contract.subject_id, contract.subject_name, contract.grade, contentSettings, req.user.id);

    if (!qs.length) return res.status(404).json({ error: 'No questions found for this subject/grade' });

    const questionIds = qs.map((q) => q.id);
    const { rows: sr } = await pool.query(
      'INSERT INTO quiz_sessions (contract_id, child_id, question_ids, total_count) VALUES ($1,$2,$3,$4) RETURNING *',
      [contract_id, req.user.id, JSON.stringify(questionIds), qs.length]
    );

    // Strip correct_index from questions before sending to client
    const safeQuestions = qs.map(({ correct_index: _ci, ...q }) => q);
    res.status(201).json({ session: sr[0], questions: safeQuestions, contract });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ── Submit an answer ─────────────────────────────────────────────────────────
router.post('/sessions/:id/answer', auth, async (req, res) => {
  const { question_id, answer_index, time_taken } = req.body;
  if (answer_index === undefined || !question_id)
    return res.status(400).json({ error: 'Неверные данные' });

  try {
    const { rows: sr } = await pool.query(
      `SELECT qs.*, c.points_per_correct, c.penalty_per_wrong, c.id AS cid
       FROM quiz_sessions qs
       JOIN contracts c ON c.id = qs.contract_id
       WHERE qs.id=$1 AND qs.child_id=$2 AND qs.completed_at IS NULL`,
      [req.params.id, req.user.id]
    );
    if (!sr[0]) return res.status(404).json({ error: 'Сессия не найдена' });
    const session = sr[0];

    // Verify question belongs to this session (parseInt guards against JSONB string vs number)
    const ids = (session.question_ids || []).map(Number);
    if (!ids.includes(Number(question_id)))
      return res.status(400).json({ error: 'Вопрос не принадлежит этой сессии' });

    // Check not already answered — return correct info so client can show feedback
    const already = await pool.query(
      'SELECT is_correct, answer_index FROM quiz_answers WHERE session_id=$1 AND question_id=$2',
      [req.params.id, question_id]
    );
    if (already.rows[0]) {
      const { rows: qr2 } = await pool.query('SELECT correct_index FROM questions WHERE id=$1', [question_id]);
      return res.status(409).json({
        error: 'Вопрос уже отвечен',
        isCorrect: already.rows[0].is_correct,
        correctIndex: qr2[0]?.correct_index ?? null,
        points: 0,
      });
    }

    const { rows: qr } = await pool.query(
      'SELECT correct_index FROM questions WHERE id=$1',
      [question_id]
    );
    if (!qr[0]) return res.status(404).json({ error: 'Вопрос не найден' });

    const isCorrect = qr[0].correct_index === answer_index;
    const delta = isCorrect ? session.points_per_correct : -session.penalty_per_wrong;

    await pool.query(
      'INSERT INTO quiz_answers (session_id, question_id, answer_index, is_correct, time_taken) VALUES ($1,$2,$3,$4,$5)',
      [req.params.id, question_id, answer_index, isCorrect, time_taken || 0]
    );
    await pool.query(
      'UPDATE quiz_sessions SET score = score + $1, correct_count = correct_count + $2 WHERE id = $3',
      [Math.max(0, delta), isCorrect ? 1 : 0, req.params.id]
    );

    // Track per-child mastery for "skip correct / mistake review" features
    await pool.query(
      `INSERT INTO child_question_mastery (child_id, question_id, correct_count, wrong_count)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (child_id, question_id) DO UPDATE SET
         correct_count = child_question_mastery.correct_count + $3,
         wrong_count   = child_question_mastery.wrong_count   + $4,
         last_seen     = NOW()`,
      [req.user.id, question_id, isCorrect ? 1 : 0, isCorrect ? 0 : 1]
    );

    res.json({ isCorrect, points: delta, correctIndex: qr[0].correct_index });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ── Complete session ──────────────────────────────────────────────────────────
router.post('/sessions/:id/complete', auth, async (req, res) => {
  try {
    const { rows: sr } = await pool.query(
      `SELECT qs.*, c.target_coins, c.current_coins, c.id AS cid
       FROM quiz_sessions qs
       LEFT JOIN contracts c ON c.id = qs.contract_id
       WHERE qs.id=$1 AND qs.child_id=$2 AND qs.completed_at IS NULL`,
      [req.params.id, req.user.id]
    );
    if (!sr[0]) return res.status(404).json({ error: 'Сессия не найдена' });
    const session = sr[0];

    await pool.query('UPDATE quiz_sessions SET completed_at = NOW() WHERE id = $1', [req.params.id]);

    // Practice sessions have no contract — skip coin accounting
    const earned = session.score;
    if (earned > 0 && session.cid) {
      const newProgress = Math.min(session.current_coins + earned, session.target_coins);
      await pool.query('UPDATE contracts SET current_coins = $1 WHERE id = $2', [
        newProgress, session.cid,
      ]);
      if (newProgress >= session.target_coins) {
        await pool.query(
          "UPDATE contracts SET status='completed', completed_at=NOW() WHERE id=$1",
          [session.cid]
        );
      }
      await pool.query('UPDATE users SET total_coins = total_coins + $1 WHERE id = $2', [
        earned, req.user.id,
      ]);
      await pool.query(
        'INSERT INTO coin_transactions (user_id, contract_id, session_id, amount, type, description) VALUES ($1,$2,$3,$4,$5,$6)',
        [req.user.id, session.cid, req.params.id, earned, 'earn', 'Тест завершён']
      );
    }

    const { rows: final } = await pool.query(
      'SELECT * FROM quiz_sessions WHERE id = $1',
      [req.params.id]
    );
    res.json(final[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ── Get mistakes for current child ──────────────────────────────────────────
// Returns questions this child has answered incorrectly, grouped by subject.
router.get('/mistakes', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         q.id, q.text, q.answers, q.correct_index, q.difficulty,
         s.id AS subject_id, s.name AS subject_name, s.name_en, s.name_de, s.emoji AS subject_emoji,
         q.grade,
         m.wrong_count, m.correct_count
       FROM child_question_mastery m
       JOIN questions q ON q.id = m.question_id
       JOIN subjects s ON s.id = q.subject_id
       WHERE m.child_id = $1 AND m.wrong_count > 0
       ORDER BY m.wrong_count DESC, m.last_seen DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Start a practice session from mistake questions ──────────────────────────
router.post('/sessions/practice', auth, async (req, res) => {
  const { question_ids } = req.body; // array of question ids to practice
  if (!Array.isArray(question_ids) || question_ids.length === 0)
    return res.status(400).json({ error: 'question_ids required' });

  try {
    const ids = question_ids.map(Number).slice(0, 10);
    const { rows: qs } = await pool.query(
      'SELECT * FROM questions WHERE id = ANY($1)',
      [ids]
    );
    if (!qs.length) return res.status(404).json({ error: 'No questions found' });

    const { rows: sr } = await pool.query(
      `INSERT INTO quiz_sessions (child_id, question_ids, total_count)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.user.id, JSON.stringify(qs.map(q => q.id)), qs.length]
    );

    const safeQuestions = qs.map(({ correct_index: _ci, ...q }) => q);
    res.status(201).json({ session: sr[0], questions: safeQuestions, practice: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Parent stats for a specific child ────────────────────────────────────────
router.get('/stats/child/:childId', auth, async (req, res) => {
  if (!['parent','admin'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });

  try {
    // Verify this child belongs to the requesting parent
    const { rows: rel } = await pool.query(
      'SELECT 1 FROM parent_child WHERE parent_id=$1 AND child_id=$2 AND status=$3',
      [req.user.id, req.params.childId, 'accepted']
    );
    if (!rel[0]) return res.status(403).json({ error: 'Not your child' });

    const childId = Number(req.params.childId);

    // Overall totals
    const { rows: totals } = await pool.query(
      `SELECT
         COUNT(DISTINCT qs.id)::int           AS total_sessions,
         COALESCE(SUM(qs.correct_count),0)::int AS total_correct,
         COALESCE(SUM(qs.total_count - qs.correct_count),0)::int AS total_wrong,
         (SELECT COUNT(*)::int FROM child_question_mastery
          WHERE child_id=$1 AND correct_count > 0) AS mastered_questions,
         (SELECT COUNT(*)::int FROM child_question_mastery
          WHERE child_id=$1 AND wrong_count > 0)   AS questions_with_mistakes
       FROM quiz_sessions qs
       WHERE qs.child_id=$1 AND qs.completed_at IS NOT NULL`,
      [childId]
    );

    // By subject
    const { rows: bySubject } = await pool.query(
      `SELECT
         s.id AS subject_id, s.name AS subject_name, s.name_en, s.name_de, s.emoji AS subject_emoji,
         COUNT(DISTINCT qs.id)::int                      AS sessions,
         COALESCE(SUM(qs.correct_count),0)::int          AS correct,
         COALESCE(SUM(qs.total_count - qs.correct_count),0)::int AS wrong,
         (SELECT COUNT(*)::int FROM child_question_mastery m2
          JOIN questions q2 ON q2.id = m2.question_id
          WHERE m2.child_id=$1 AND q2.subject_id=s.id AND m2.correct_count > 0) AS mastered
       FROM quiz_sessions qs
       JOIN contracts c ON c.id = qs.contract_id
       JOIN subjects s ON s.id = c.subject_id
       WHERE qs.child_id=$1 AND qs.completed_at IS NOT NULL
       GROUP BY s.id, s.name, s.name_en, s.name_de, s.emoji
       ORDER BY wrong DESC`,
      [childId]
    );

    // Top 10 weak spots (most wrong answers)
    const { rows: weakTopics } = await pool.query(
      `SELECT q.id, q.text, q.difficulty, s.name AS subject_name, s.emoji AS subject_emoji,
              m.wrong_count, m.correct_count
       FROM child_question_mastery m
       JOIN questions q ON q.id = m.question_id
       JOIN subjects s ON s.id = q.subject_id
       WHERE m.child_id=$1 AND m.wrong_count > 0
       ORDER BY m.wrong_count DESC
       LIMIT 10`,
      [childId]
    );

    // Recent 5 sessions
    const { rows: recentSessions } = await pool.query(
      `SELECT qs.id, qs.started_at, qs.completed_at, qs.score, qs.correct_count, qs.total_count,
              s.name AS subject_name, s.emoji AS subject_emoji, c.title AS contract_title
       FROM quiz_sessions qs
       LEFT JOIN contracts c ON c.id = qs.contract_id
       LEFT JOIN subjects s ON s.id = c.subject_id
       WHERE qs.child_id=$1 AND qs.completed_at IS NOT NULL
       ORDER BY qs.completed_at DESC
       LIMIT 5`,
      [childId]
    );

    res.json({
      ...totals[0],
      bySubject,
      weakTopics,
      recentSessions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;