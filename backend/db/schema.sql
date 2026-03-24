-- =====================================================
-- BrainCoin Database Schema
-- =====================================================

-- Users (parents and children)
CREATE TABLE IF NOT EXISTS users (
  id                   SERIAL PRIMARY KEY,
  email                VARCHAR(255) UNIQUE NOT NULL,
  password_hash        VARCHAR(255) NOT NULL,
  role                 VARCHAR(10) NOT NULL CHECK (role IN ('parent', 'child')),
  name                 VARCHAR(100) NOT NULL,
  age                  INTEGER,
  grade                VARCHAR(10),
  ui_language          VARCHAR(5) DEFAULT 'de',
  content_settings     JSONB DEFAULT '{}',
  avatar_emoji         VARCHAR(10) DEFAULT '😊',
  total_coins          INTEGER DEFAULT 0,
  is_admin             BOOLEAN DEFAULT FALSE,
  -- Stripe subscription fields (parents only)
  stripe_customer_id   VARCHAR(100),
  stripe_sub_id        VARCHAR(100),
  sub_status           VARCHAR(20) DEFAULT 'none' CHECK (sub_status IN ('none','trialing','active','past_due','canceled')),
  trial_ends_at        TIMESTAMP,
  sub_current_period_end TIMESTAMP,
  created_at           TIMESTAMP DEFAULT NOW()
);

-- Parent ↔ Child relationships
CREATE TABLE IF NOT EXISTS parent_child (
  id         SERIAL PRIMARY KEY,
  parent_id  INTEGER REFERENCES users(id) ON DELETE CASCADE,
  child_id   INTEGER REFERENCES users(id) ON DELETE CASCADE,
  status     VARCHAR(10) DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(parent_id, child_id)
);

-- Invite codes (for linking parent ↔ child)
CREATE TABLE IF NOT EXISTS invite_codes (
  id         SERIAL PRIMARY KEY,
  code       VARCHAR(8) UNIQUE NOT NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
  used_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Subjects
CREATE TABLE IF NOT EXISTS subjects (
  id      SERIAL PRIMARY KEY,
  name    VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  name_de VARCHAR(100),
  slug    VARCHAR(50) UNIQUE,
  emoji   VARCHAR(10) DEFAULT '📚',
  grades  TEXT[] DEFAULT ARRAY['5','6','7','8','9']
);

-- Question bank
CREATE TABLE IF NOT EXISTS questions (
  id            SERIAL PRIMARY KEY,
  subject_id    INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  grade         VARCHAR(10) NOT NULL,
  text          TEXT NOT NULL,
  answers       JSONB NOT NULL,
  correct_index INTEGER NOT NULL CHECK (correct_index BETWEEN 0 AND 3),
  difficulty    VARCHAR(10) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Contracts / Quests
CREATE TABLE IF NOT EXISTS contracts (
  id                 SERIAL PRIMARY KEY,
  created_by         INTEGER REFERENCES users(id),
  parent_id          INTEGER REFERENCES users(id),
  child_id           INTEGER REFERENCES users(id),
  subject_id         INTEGER REFERENCES subjects(id),
  grade              VARCHAR(10) NOT NULL,
  title              VARCHAR(200) NOT NULL,
  description        TEXT,
  prize_name         VARCHAR(200) NOT NULL,
  prize_emoji        VARCHAR(10) DEFAULT '🏆',
  prize_coins        INTEGER NOT NULL DEFAULT 100,
  points_per_correct INTEGER DEFAULT 5,
  penalty_per_wrong  INTEGER DEFAULT 2,
  time_per_question  INTEGER DEFAULT 30,
  target_coins       INTEGER NOT NULL DEFAULT 100,
  current_coins      INTEGER DEFAULT 0,
  status             VARCHAR(10) DEFAULT 'pending' CHECK (status IN ('pending','active','completed','rejected')),
  child_accepted     BOOLEAN DEFAULT FALSE,
  parent_accepted    BOOLEAN DEFAULT FALSE,
  created_at         TIMESTAMP DEFAULT NOW(),
  completed_at       TIMESTAMP
);

-- Quiz sessions
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id            SERIAL PRIMARY KEY,
  contract_id   INTEGER REFERENCES contracts(id),
  child_id      INTEGER REFERENCES users(id),
  question_ids  JSONB,
  started_at    TIMESTAMP DEFAULT NOW(),
  completed_at  TIMESTAMP,
  score         INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  total_count   INTEGER DEFAULT 0
);

-- Individual quiz answers
CREATE TABLE IF NOT EXISTS quiz_answers (
  id          SERIAL PRIMARY KEY,
  session_id  INTEGER REFERENCES quiz_sessions(id),
  question_id INTEGER REFERENCES questions(id),
  answer_index INTEGER,
  is_correct  BOOLEAN,
  time_taken  INTEGER DEFAULT 0,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Coin transactions ledger
CREATE TABLE IF NOT EXISTS coin_transactions (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id),
  contract_id INTEGER REFERENCES contracts(id),
  session_id  INTEGER REFERENCES quiz_sessions(id),
  amount      INTEGER NOT NULL,
  type        VARCHAR(10) CHECK (type IN ('earn','penalty','spend','bonus')),
  description TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Friendships between children
CREATE TABLE IF NOT EXISTS friendships (
  id           SERIAL PRIMARY KEY,
  requester_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  addressee_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  status       VARCHAR(10) DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  created_at   TIMESTAMP DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);

-- Chat messages
CREATE TABLE IF NOT EXISTS messages (
  id          SERIAL PRIMARY KEY,
  sender_id   INTEGER REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Per-child question mastery tracking
CREATE TABLE IF NOT EXISTS child_question_mastery (
  child_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
  question_id   INTEGER REFERENCES questions(id) ON DELETE CASCADE,
  correct_count INTEGER DEFAULT 0,
  wrong_count   INTEGER DEFAULT 0,
  last_seen     TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (child_id, question_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pc_parent    ON parent_child(parent_id);
CREATE INDEX IF NOT EXISTS idx_pc_child     ON parent_child(child_id);
CREATE INDEX IF NOT EXISTS idx_contracts_parent ON contracts(parent_id);
CREATE INDEX IF NOT EXISTS idx_contracts_child  ON contracts(child_id);
CREATE INDEX IF NOT EXISTS idx_questions_sg ON questions(subject_id, grade);
CREATE INDEX IF NOT EXISTS idx_tx_user      ON coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_msg_sender   ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_msg_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_fr_req       ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_fr_addr      ON friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_mastery_child ON child_question_mastery(child_id);
