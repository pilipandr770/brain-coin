/**
 * Background AI Question Generation Job
 *
 * Cycles through all subjects (excluding math and geography which use local generators)
 * and pre-fills the question pool to MIN_POOL using Claude API.
 *
 * Admin can start/stop the job and monitor progress + cost via API.
 */

const { pool }           = require('../db');
const { callClaude, saveToDb } = require('./questionGenerator');

const MIN_POOL = 40;

// Claude pricing (claude-opus-4-5)
const COST_PER_INPUT_TOKEN  = 15  / 1_000_000; // $15 per 1M
const COST_PER_OUTPUT_TOKEN = 75  / 1_000_000; // $75 per 1M

// In-memory state (resets on server restart)
const state = {
  running:          false,
  currentSubject:   null,
  currentGrade:     null,
  progressDone:     0,
  progressTotal:    0,
  sessionGenerated: 0, // questions generated in current admin-triggered run
  startedAt:        null,
};

// ─── Lifetime stats (loaded from DB) ─────────────────────────────────────────
let lifetimeStats = null;

async function loadLifetimeStats() {
  try {
    const { rows } = await pool.query(
      `SELECT
         COALESCE(SUM(questions_generated), 0)::int AS total_questions,
         COALESCE(SUM(input_tokens),        0)::int AS total_input_tokens,
         COALESCE(SUM(output_tokens),       0)::int AS total_output_tokens,
         COALESCE(SUM(cost_usd),            0)      AS total_cost_usd
       FROM api_gen_log`
    );
    lifetimeStats = rows[0];
  } catch {
    lifetimeStats = { total_questions: 0, total_input_tokens: 0, total_output_tokens: 0, total_cost_usd: 0 };
  }
}

// ─── Log one generation run ───────────────────────────────────────────────────
async function logUsage(subjectId, grade, questionsCount, inputTokens, outputTokens) {
  const costUsd = inputTokens * COST_PER_INPUT_TOKEN + outputTokens * COST_PER_OUTPUT_TOKEN;
  try {
    await pool.query(
      `INSERT INTO api_gen_log (subject_id, grade, questions_generated, input_tokens, output_tokens, cost_usd, triggered_by)
       VALUES ($1, $2, $3, $4, $5, $6, 'admin')`,
      [subjectId, grade, questionsCount, inputTokens, outputTokens, costUsd]
    );
  } catch (err) {
    console.warn('[genJob] Could not write to api_gen_log:', err.message);
  }
  return costUsd;
}

// ─── Main generation loop ─────────────────────────────────────────────────────
async function runGeneration() {
  // Get all subjects except math and geography (those use local generators)
  const { rows: subjects } = await pool.query(
    `SELECT id, name, slug, grades FROM subjects
     WHERE slug NOT IN ('math', 'geography')
     ORDER BY name`
  );

  const GRADES = ['4', '5', '6', '7', '8', '9'];
  const tasks = [];
  for (const subj of subjects) {
    for (const grade of (subj.grades || GRADES)) {
      tasks.push({ subjectId: subj.id, subjectName: subj.name, grade });
    }
  }

  state.progressTotal    = tasks.length;
  state.progressDone     = 0;
  state.sessionGenerated = 0;

  for (const task of tasks) {
    if (!state.running) break;

    state.currentSubject = task.subjectName;
    state.currentGrade   = task.grade;

    try {
      const { rows: countRow } = await pool.query(
        'SELECT COUNT(*)::int AS cnt FROM questions WHERE subject_id=$1 AND grade=$2',
        [task.subjectId, task.grade]
      );
      const current = countRow[0].cnt;

      if (current < MIN_POOL) {
        const needed = MIN_POOL - current;
        console.log(`[genJob] Generating ${needed} questions for ${task.subjectName} grade ${task.grade}…`);

        const { questions, inputTokens, outputTokens } = await callClaude(task.subjectName, task.grade, needed);

        if (questions.length > 0) {
          const saved = await saveToDb(task.subjectId, task.grade, questions);
          state.sessionGenerated += saved.length;
          await logUsage(task.subjectId, task.grade, saved.length, inputTokens, outputTokens);
          console.log(`[genJob] Saved ${saved.length} questions — input: ${inputTokens}, output: ${outputTokens}`);
        }
      }
    } catch (err) {
      console.error(`[genJob] Error for ${task.subjectName} grade ${task.grade}:`, err.message);
    }

    state.progressDone++;
    // Brief pause between API calls to avoid rate limiting
    if (state.running) await new Promise(r => setTimeout(r, 1500));
  }

  state.running        = false;
  state.currentSubject = null;
  state.currentGrade   = null;
  await loadLifetimeStats();
  console.log(`[genJob] Finished. Total generated this session: ${state.sessionGenerated}`);
}

// ─── Public API ───────────────────────────────────────────────────────────────
function startJob() {
  if (state.running) return false;
  state.running   = true;
  state.startedAt = new Date().toISOString();
  runGeneration().catch(err => {
    console.error('[genJob] Fatal error:', err);
    state.running = false;
  });
  return true;
}

function stopJob() {
  state.running = false;
}

async function getStatus() {
  if (!lifetimeStats) await loadLifetimeStats();
  return {
    running:          state.running,
    currentSubject:   state.currentSubject,
    currentGrade:     state.currentGrade,
    progressDone:     state.progressDone,
    progressTotal:    state.progressTotal,
    sessionGenerated: state.sessionGenerated,
    startedAt:        state.startedAt,
    lifetime: {
      totalQuestions:   Number(lifetimeStats.total_questions),
      totalInputTokens: Number(lifetimeStats.total_input_tokens),
      totalOutputTokens: Number(lifetimeStats.total_output_tokens),
      totalCostUsd:     Number(lifetimeStats.total_cost_usd),
    },
  };
}

async function getPoolStats() {
  try {
    const { rows } = await pool.query(
      `SELECT s.name AS subject, s.emoji, q.grade, COUNT(*)::int AS count
       FROM questions q
       JOIN subjects s ON s.id = q.subject_id
       GROUP BY s.id, s.name, s.emoji, q.grade
       ORDER BY s.name, q.grade`
    );
    return rows;
  } catch {
    return [];
  }
}

module.exports = { startJob, stopJob, getStatus, getPoolStats, loadLifetimeStats };
