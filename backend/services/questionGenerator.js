/**
 * Question Generator Service
 *
 * Uses Anthropic Claude to generate multiple-choice questions on demand.
 * Generated questions are saved to the DB immediately so future sessions
 * reuse them — no repeat API calls once the pool is large enough.
 *
 * Strategy (per subject + grade):
 *   MIN_POOL = 30  questions in DB
 *   If current count < MIN_POOL  → generate (MIN_POOL − current) questions
 *   Then return 10 random questions from the full pool.
 */

const Anthropic = require('@anthropic-ai/sdk');
const { pool }  = require('../db');

const MIN_POOL = 30; // keep at least this many questions per subject+grade

/**
 * Shuffle answers for a question, tracking the new position of the correct answer.
 * The correct answer is assumed to be at index 0 (as Claude is instructed).
 */
function shuffleAnswers(answers) {
  const correctAnswer = answers[0];
  const arr = [...answers];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return { answers: arr, correctIndex: arr.indexOf(correctAnswer) };
}

/**
 * Call Claude to generate new questions.
 * @param {string} subjectName
 * @param {string} grade
 * @param {number} count
 * @param {object} contentSettings  parent-defined content filters
 */
async function callClaude(subjectName, grade, count, contentSettings = {}) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set');
  }

  // Build content-filter exclusion block for the prompt
  const exclusions = [];
  if (contentSettings.safe_mode) {
    exclusions.push('Використовуй виключно фактичні питання (математика, природничі науки, мова). Жодних суспільних, історичних або етичних тем.');
  } else {
    if (contentSettings.block_religion)  exclusions.push('Не став питань про релігію, церкву або духовність.');
    if (contentSettings.block_politics)  exclusions.push('Не став питань політичного характеру (політики, партії, вожді).');
    if (contentSettings.block_conflicts) exclusions.push('Не став детальних питань про війни, страти чи насильство.');
    if (contentSettings.block_mature)    exclusions.push('Не став жодних питань для дорослих чи з експліцитним змістом.');
  }
  const exclusionBlock = exclusions.length
    ? `\n\nОБМЕЖЕННЯ (обов'язково дотримуйся):\n${exclusions.map((e, i) => `${i + 1}. ${e}`).join('\n')}`
    : '';

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `Ти — вчитель та автор тестових завдань для українських школярів.

Згенеруй рівно ${count} питань з предмету "${subjectName}" для ${grade} класу (шкільна програма України).

ВИМОГИ:
- Кожне питання по-українськи
- 4 варіанти відповіді, лише один правильний
- ПРАВИЛЬНА відповідь ЗАВЖДИ першою (індекс 0) у масиві answers. Ми самі перемішуємо варіанти після генерації — тому correct_index завжди 0.
- Різноманітні теми в межах шкільної програми ${grade} класу з "${subjectName}"
- Чіткі та однозначні формулювання
- Неправильні варіанти мають бути правдоподібними (не абсурдними)
- Розподіл складності: приблизно 30% easy, 50% medium, 20% hard${exclusionBlock}

Поверни ЛИШЕ JSON-масив без будь-якого іншого тексту. Кожен елемент масиву:
{
  "text": "текст питання",
  "answers": ["ПРАВИЛЬНА відповідь", "хибна 1", "хибна 2", "хибна 3"],
  "correct_index": 0,
  "difficulty": "easy"
}

ВАЖЛИВО: answers[0] ЗАВЖДИ є правильною відповіддю на питання. correct_index завжди 0.`;

  const message = await client.messages.create({
    model:     'claude-opus-4-5',
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = message.content[0].text.trim();

  // Extract the JSON array even if there's stray text
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) throw new Error(`Claude did not return a JSON array. Got: ${raw.slice(0, 200)}`);

  const parsed = JSON.parse(match[0]);

  // Validate each item before returning
  return parsed.filter((q) => {
    return (
      typeof q.text         === 'string' && q.text.trim() &&
      Array.isArray(q.answers) && q.answers.length === 4 &&
      typeof q.correct_index === 'number' &&
      q.correct_index >= 0 && q.correct_index <= 3 &&
      ['easy', 'medium', 'hard'].includes(q.difficulty)
    );
  });
}

/**
 * Insert generated questions into the DB.
 * @param {number} subjectId
 * @param {string} grade
 * @param {Array}  questions
 * @returns {Array} inserted rows
 */
async function saveToDb(subjectId, grade, questions) {
  const inserted = [];
  for (const q of questions) {
    try {
      // Claude puts the correct answer at index 0. Shuffle here so the
      // correct position is random in the DB — and we track it ourselves.
      const { answers, correctIndex } = shuffleAnswers(q.answers);
      const { rows } = await pool.query(
        `INSERT INTO questions (subject_id, grade, text, answers, correct_index, difficulty)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [subjectId, grade, q.text.trim(), JSON.stringify(answers), correctIndex, q.difficulty]
      );
      inserted.push(rows[0]);
    } catch (err) {
      // Log but don't fail the whole batch (e.g. duplicate text)
      console.warn('[questionGenerator] Skipped question:', err.message);
    }
  }
  return inserted;
}

/**
 * Ensure the DB has at least MIN_POOL questions for the given subject+grade.
 * If not, call Claude to generate the deficit and save them.
 * Then return 10 random questions from the pool, preferring questions the child
 * has NOT yet answered correctly (mastered). Falls back to full pool if needed.
 *
 * @param {number} subjectId
 * @param {string} subjectName  used in the Claude prompt
 * @param {string} grade
 * @param {object} contentSettings  parent-defined content filters
 * @param {number|null} childId  if set, skip questions already mastered by this child
 * @returns {Array} up to 10 question rows (with correct_index)
 */
async function ensureAndPickQuestions(subjectId, subjectName, grade, contentSettings = {}, childId = null) {
  // How many do we have?
  const { rows: countRow } = await pool.query(
    'SELECT COUNT(*)::int AS cnt FROM questions WHERE subject_id=$1 AND grade=$2',
    [subjectId, grade]
  );
  const current = countRow[0].cnt;

  if (current < MIN_POOL && process.env.ANTHROPIC_API_KEY) {
    const needed = MIN_POOL - current;
    console.log(`[questionGenerator] Generating ${needed} questions for ${subjectName} grade ${grade}…`);
    try {
      const generated = await callClaude(subjectName, grade, needed, contentSettings);
      if (generated.length > 0) {
        await saveToDb(subjectId, grade, generated);
        console.log(`[questionGenerator] Saved ${generated.length} new questions to DB`);
      }
    } catch (err) {
      // Generation failed → fall back to whatever is in the DB (could be seed data)
      console.error('[questionGenerator] Generation failed, using existing pool:', err.message);
    }
  } else if (current < MIN_POOL) {
    console.warn('[questionGenerator] ANTHROPIC_API_KEY not set — using seed questions only');
  }

  // Pick 10 random questions — prefer ones not yet mastered by this child
  if (childId) {
    // First try: questions not answered correctly yet
    const { rows: fresh } = await pool.query(
      `SELECT q.* FROM questions q
       WHERE q.subject_id=$1 AND q.grade=$2
       AND q.id NOT IN (
         SELECT question_id FROM child_question_mastery
         WHERE child_id=$3 AND correct_count > 0
       )
       ORDER BY RANDOM() LIMIT 10`,
      [subjectId, grade, childId]
    );
    if (fresh.length >= 5) return fresh; // enough fresh questions

    // Fall back: mix fresh + already-seen (child has mastered most of the pool)
    const stillNeed = 10 - fresh.length;
    const freshIds  = fresh.map(q => q.id);
    const placeholders = freshIds.length > 0
      ? `AND q.id NOT IN (${freshIds.map((_, i) => `$${i + 4}`).join(',')})`
      : '';
    const { rows: extra } = await pool.query(
      `SELECT q.* FROM questions q
       WHERE q.subject_id=$1 AND q.grade=$2 ${placeholders}
       ORDER BY RANDOM() LIMIT $3`,
      [subjectId, grade, stillNeed, ...freshIds]
    );
    return [...fresh, ...extra];
  }

  // No childId — pick randomly from full pool
  const { rows } = await pool.query(
    'SELECT * FROM questions WHERE subject_id=$1 AND grade=$2 ORDER BY RANDOM() LIMIT 10',
    [subjectId, grade]
  );
  return rows;
}

module.exports = { ensureAndPickQuestions };
