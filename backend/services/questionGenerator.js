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
const { generateMathQuestions }         = require('./mathGenerator');
const { generateAllGeographyQuestions } = require('./geographyGenerator');

const MIN_POOL = 40; // keep at least this many questions per subject+grade

// Age in years for each grade (German school system)
const GRADE_AGE = { '4': 10, '5': 11, '6': 12, '7': 13, '8': 14, '9': 15 };

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
    exclusions.push('Verwende ausschließlich sachliche Fragen (Mathematik, Naturwissenschaften, Sprache). Keine gesellschaftlichen, historischen oder ethischen Themen.');
  } else {
    if (contentSettings.block_religion)  exclusions.push('Keine Fragen über Religion, Kirche oder Spiritualität.');
    if (contentSettings.block_politics)  exclusions.push('Keine politischen Fragen (Politiker, Parteien, politische Führung).');
    if (contentSettings.block_conflicts) exclusions.push('Keine detaillierten Fragen über Kriege, Hinrichtungen oder Gewalt.');
    if (contentSettings.block_mature)    exclusions.push('Keine Fragen mit explizitem oder nicht altersgerechtem Inhalt.');
  }
  const exclusionBlock = exclusions.length
    ? `\n\nEINSCHRÄNKUNGEN (unbedingt einhalten):\n${exclusions.map((e, i) => `${i + 1}. ${e}`).join('\n')}`
    : '';

  const age = GRADE_AGE[grade] || 12;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `Du bist ein erfahrener Lehrer und Fragenautor für die deutsche Mittelschule.

Erstelle genau ${count} Multiple-Choice-Fragen im Fach "${subjectName}" für die ${grade}. Klasse (deutsches Schulsystem, Lehrplan für ca. ${age}-jährige Schülerinnen und Schüler).

ANFORDERUNGEN:
- Alle Fragen auf Deutsch
- 4 Antwortmöglichkeiten, nur eine ist richtig
- Die RICHTIGE Antwort steht IMMER an erster Stelle (Index 0) im Array "answers". Das Mischen der Optionen übernehmen wir selbst nach der Generierung — daher ist correct_index immer 0.
- Abwechslungsreiche Themen aus dem deutschen Lehrplan der ${grade}. Klasse für "${subjectName}"
- Klare und eindeutige Formulierungen, altersgerecht für ${age}-Jährige
- Falsche Antworten sollen plausibel wirken (nicht absurd)
- Schwierigkeitsverteilung: ca. 30 % easy, 50 % medium, 20 % hard${exclusionBlock}

Gib NUR ein JSON-Array zurück, keinerlei weiterer Text. Jedes Element:
{
  "text": "Fragetext",
  "answers": ["RICHTIGE Antwort", "falsche 1", "falsche 2", "falsche 3"],
  "correct_index": 0,
  "difficulty": "easy"
}

WICHTIG: answers[0] ist IMMER die richtige Antwort. correct_index ist immer 0.`;

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
  const questions = parsed.filter((q) => {
    return (
      typeof q.text         === 'string' && q.text.trim() &&
      Array.isArray(q.answers) && q.answers.length === 4 &&
      typeof q.correct_index === 'number' &&
      q.correct_index >= 0 && q.correct_index <= 3 &&
      ['easy', 'medium', 'hard'].includes(q.difficulty)
    );
  });

  return {
    questions,
    inputTokens:  message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  };
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
  // ── Resolve subject slug to intercept math / geography ──────────────────────
  const { rows: slugRows } = await pool.query(
    'SELECT slug FROM subjects WHERE id=$1',
    [subjectId]
  );
  const slug = slugRows[0]?.slug;

  // ── Math: always generate fresh questions, no pool needed ───────────────────
  if (slug === 'math') {
    const generated = generateMathQuestions(grade, 10);
    return await saveToDb(subjectId, grade, generated);
  }

  // ── Geography: seed pool once from static capitals list, then pick normally ─
  if (slug === 'geography') {
    const { rows: geoCount } = await pool.query(
      'SELECT COUNT(*)::int AS cnt FROM questions WHERE subject_id=$1 AND grade=$2',
      [subjectId, grade]
    );
    if (geoCount[0].cnt < 50) {
      const geoQuestions = generateAllGeographyQuestions();
      await saveToDb(subjectId, grade, geoQuestions);
      console.log(`[questionGenerator] Seeded ${geoQuestions.length} geography questions for grade ${grade}`);
    }
    // Fall through to normal random pick below
  } else {
    // ── All other subjects: use Claude when pool is thin ─────────────────────────
    const { rows: countRow } = await pool.query(
      'SELECT COUNT(*)::int AS cnt FROM questions WHERE subject_id=$1 AND grade=$2',
      [subjectId, grade]
    );
    const current = countRow[0].cnt;

    if (current < MIN_POOL && process.env.ANTHROPIC_API_KEY) {
      const needed = MIN_POOL - current;
      console.log(`[questionGenerator] Generating ${needed} questions for ${subjectName} grade ${grade}…`);
      try {
        const { questions: generated, inputTokens, outputTokens } = await callClaude(subjectName, grade, needed, contentSettings);
        if (generated.length > 0) {
          await saveToDb(subjectId, grade, generated);
          console.log(`[questionGenerator] Saved ${generated.length} new questions to DB`);
          // Log token usage (non-fatal)
          const costUsd = (inputTokens * 15 + outputTokens * 75) / 1_000_000;
          pool.query(
            `INSERT INTO api_gen_log (subject_id, grade, questions_generated, input_tokens, output_tokens, cost_usd, triggered_by)
             VALUES ($1,$2,$3,$4,$5,$6,'auto')`,
            [subjectId, grade, generated.length, inputTokens, outputTokens, costUsd]
          ).catch(() => {});
        }
      } catch (err) {
        console.error('[questionGenerator] Generation failed, using existing pool:', err.message);
      }
    } else if (current < MIN_POOL) {
      console.warn('[questionGenerator] ANTHROPIC_API_KEY not set — using seed questions only');
    }
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

module.exports = { ensureAndPickQuestions, callClaude, saveToDb };
