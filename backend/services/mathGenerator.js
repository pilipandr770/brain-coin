/**
 * Math Question Generator
 *
 * Generates arithmetic multiple-choice questions algorithmically — no AI API needed.
 * Two random numbers, random operator, correct answer computed, 3 plausible wrong answers.
 * Correct answer is placed at index 0; saveToDb handles the shuffle and stores real index.
 */

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateWrongAnswers(correct, count = 3) {
  const range = Math.max(3, Math.ceil(Math.abs(correct) * 0.2));
  const set = new Set();
  let attempts = 0;
  while (set.size < count && attempts < 150) {
    const delta = rand(1, range);
    const candidate = Math.random() < 0.5 ? correct + delta : correct - delta;
    if (candidate !== correct && candidate >= 0) set.add(candidate);
    attempts++;
  }
  // Fallback: just add incrementally
  let offset = 1;
  while (set.size < count) {
    const candidate = correct + offset;
    if (!set.has(candidate)) set.add(candidate);
    offset++;
  }
  return [...set].slice(0, count);
}

function generateOneMathQuestion(grade) {
  const gradeNum = parseInt(grade, 10) || 5;

  // Available operations by grade level
  let ops;
  if (gradeNum <= 4) ops = ['+', '-', '*'];
  else ops = ['+', '-', '*', '/'];

  const op = ops[rand(0, ops.length - 1)];

  let a, b, correct;

  if (op === '+') {
    const maxVal = gradeNum >= 7 ? 9999 : gradeNum >= 5 ? 999 : 99;
    a = rand(1, maxVal);
    b = rand(1, maxVal);
    correct = a + b;
  } else if (op === '-') {
    const maxVal = gradeNum >= 7 ? 9999 : gradeNum >= 5 ? 999 : 99;
    a = rand(2, maxVal);
    b = rand(1, a); // ensure positive result
    correct = a - b;
  } else if (op === '*') {
    const maxFactor = gradeNum >= 7 ? 25 : gradeNum >= 5 ? 20 : 12;
    a = rand(2, maxFactor);
    b = rand(2, maxFactor);
    correct = a * b;
  } else {
    // Division: always clean integer
    b = rand(2, 12);
    correct = rand(1, gradeNum >= 7 ? 25 : 15);
    a = b * correct;
  }

  const wrongs = generateWrongAnswers(correct);
  // Put correct answer at index 0 — saveToDb will shuffle and track correct_index
  const answers = [correct, ...wrongs];

  const opDisplay = { '+': '+', '-': '−', '*': '×', '/': '÷' }[op];

  return {
    text: `${a} ${opDisplay} ${b} = ?`,
    answers: answers.map(String),
    correct_index: 0,  // always 0 — saveToDb shuffles and stores the real index
    difficulty: gradeNum <= 5 ? 'easy' : gradeNum <= 7 ? 'medium' : 'hard',
  };
}

/**
 * Generate `count` fresh math questions for the given school grade.
 * These are generated on-the-fly — no Claude API call needed.
 */
function generateMathQuestions(grade, count = 10) {
  return Array.from({ length: count }, () => generateOneMathQuestion(grade));
}

module.exports = { generateMathQuestions };
