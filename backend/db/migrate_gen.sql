-- Migration: API generation logging table
SET search_path TO braincoin;

CREATE TABLE IF NOT EXISTS api_gen_log (
  id                   SERIAL PRIMARY KEY,
  subject_id           INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
  grade                VARCHAR(5),
  questions_generated  INTEGER     DEFAULT 0,
  input_tokens         INTEGER     DEFAULT 0,
  output_tokens        INTEGER     DEFAULT 0,
  cost_usd             NUMERIC(10, 6) DEFAULT 0,
  triggered_by         VARCHAR(20) DEFAULT 'auto', -- 'auto' | 'admin'
  created_at           TIMESTAMP   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gen_log_subject ON api_gen_log(subject_id);
CREATE INDEX IF NOT EXISTS idx_gen_log_created ON api_gen_log(created_at DESC);
