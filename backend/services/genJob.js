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

// How many questions to generate per topic+grade combination.
// Raise this env var to expand the pool (e.g. 500 → ~262 500 questions).
const TARGET_PER_TOPIC = parseInt(process.env.QUESTIONS_TARGET_PER_TOPIC || '200', 10);
// Questions requested per single Claude API call (fits in one 8 192-token response)
const BATCH_SIZE = 15;

// Claude pricing (claude-opus-4-5)
const COST_PER_INPUT_TOKEN  = 15  / 1_000_000; // $15 per 1M
const COST_PER_OUTPUT_TOKEN = 75  / 1_000_000; // $75 per 1M

// In-memory state (resets on server restart)
const state = {
  running:          false,
  currentSubject:   null,
  currentTopic:     null,   // ← topic being processed right now
  currentGrade:     null,
  progressDone:     0,
  progressTotal:    0,
  sessionGenerated: 0,
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
  // Load all curriculum topics (excludes math and geography — local generators)
  const { rows: topicRows } = await pool.query(
    `SELECT t.id AS topic_id, t.name_de AS topic_name,
            s.id AS subject_id, s.name AS subject_name, s.grades
     FROM subject_topics t
     JOIN subjects s ON s.id = t.subject_id
     WHERE s.slug NOT IN ('math', 'geography')
     ORDER BY s.name, t.sort_order`
  );

  if (topicRows.length === 0) {
    console.warn('[genJob] No topics found in subject_topics table. Run migrate_topics.sql first.');
    state.running = false;
    return;
  }

  const GRADES = ['4', '5', '6', '7', '8', '9'];
  const tasks = [];
  for (const t of topicRows) {
    for (const grade of (t.grades || GRADES)) {
      tasks.push({
        topicId:     t.topic_id,
        topicName:   t.topic_name,
        subjectId:   t.subject_id,
        subjectName: t.subject_name,
        grade,
      });
    }
  }

  state.progressTotal    = tasks.length;
  state.progressDone     = 0;
  state.sessionGenerated = 0;

  console.log(`[genJob] Starting — ${tasks.length} topic×grade tasks, target ${TARGET_PER_TOPIC} q/topic`);

  for (const task of tasks) {
    if (!state.running) break;

    state.currentSubject = task.subjectName;
    state.currentTopic   = task.topicName;
    state.currentGrade   = task.grade;

    try {
      const { rows: countRow } = await pool.query(
        'SELECT COUNT(*)::int AS cnt FROM questions WHERE topic_id=$1 AND grade=$2',
        [task.topicId, task.grade]
      );
      const current = countRow[0].cnt;

      // Fill this topic bucket up to TARGET_PER_TOPIC in batches of BATCH_SIZE
      let remaining = TARGET_PER_TOPIC - current;
      while (remaining > 0 && state.running) {
        const batchSize = Math.min(remaining, BATCH_SIZE);
        console.log(
          `[genJob] ${task.subjectName} / ${task.topicName} grade ${task.grade}` +
          ` — generating ${batchSize} (${current + state.sessionGenerated % 1} have, need ${remaining} more)…`
        );

        const { questions, inputTokens, outputTokens } =
          await callClaude(task.subjectName, task.grade, batchSize, {}, task.topicName);

        if (questions.length > 0) {
          const saved = await saveToDb(task.subjectId, task.grade, questions, task.topicId);
          state.sessionGenerated += saved.length;
          remaining -= saved.length;
          await logUsage(task.subjectId, task.grade, saved.length, inputTokens, outputTokens);
        } else {
          break; // Claude returned nothing — move on
        }

        if (state.running && remaining > 0) {
          await new Promise(r => setTimeout(r, 1500));
        }
      }
    } catch (err) {
      console.error(
        `[genJob] Error for ${task.subjectName}/${task.topicName} grade ${task.grade}:`,
        err.message
      );
    }

    state.progressDone++;
    if (state.running) await new Promise(r => setTimeout(r, 1500));
  }

  state.running        = false;
  state.currentSubject = null;
  state.currentTopic   = null;
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
    currentTopic:     state.currentTopic,
    currentGrade:     state.currentGrade,
    progressDone:     state.progressDone,
    progressTotal:    state.progressTotal,
    targetPerTopic:   TARGET_PER_TOPIC,
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
    // Aggregate by subject + grade (summary view)
    const { rows: summary } = await pool.query(
      `SELECT s.name AS subject, s.emoji, s.slug, q.grade,
              COUNT(*)::int AS count
       FROM questions q
       JOIN subjects s ON s.id = q.subject_id
       GROUP BY s.id, s.name, s.emoji, s.slug, q.grade
       ORDER BY s.name, q.grade`
    );
    // Topic-level breakdown for admin detail view
    const { rows: topics } = await pool.query(
      `SELECT s.name AS subject, s.slug, q.grade,
              t.name_de AS topic, COUNT(*)::int AS count
       FROM questions q
       JOIN subjects s ON s.id = q.subject_id
       LEFT JOIN subject_topics t ON t.id = q.topic_id
       GROUP BY s.name, s.slug, q.grade, t.name_de
       ORDER BY s.name, q.grade, t.name_de`
    );
    return { summary, topics, targetPerTopic: TARGET_PER_TOPIC };
  } catch {
    return { summary: [], topics: [], targetPerTopic: TARGET_PER_TOPIC };
  }
}

module.exports = { startJob, stopJob, getStatus, getPoolStats, loadLifetimeStats };
