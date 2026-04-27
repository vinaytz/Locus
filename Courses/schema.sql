-- Scalable MCQ Platform Schema (SQLite-compatible)
-- Mirrors Helper/Scalable MCQ App Database Architecture.md
-- JSONB is unavailable in SQLite, so `content` is stored as TEXT (JSON string).

PRAGMA foreign_keys = ON;

-- 2.1 Educational Hierarchy ---------------------------------------------------
CREATE TABLE IF NOT EXISTS subjects (
  id           TEXT PRIMARY KEY,        -- slug-based id
  name         TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  icon         TEXT,
  description  TEXT
);

CREATE TABLE IF NOT EXISTS units (
  id           TEXT PRIMARY KEY,
  subject_id   TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  order_index  INTEGER NOT NULL DEFAULT 0,
  description  TEXT
);
CREATE INDEX IF NOT EXISTS idx_units_subject ON units(subject_id);

CREATE TABLE IF NOT EXISTS exercises (
  id           TEXT PRIMARY KEY,
  unit_id      TEXT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  duration     INTEGER NOT NULL DEFAULT 5,    -- minutes
  points       INTEGER NOT NULL DEFAULT 10,
  order_index  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_exercises_unit ON exercises(unit_id);

-- 2.2 Exam Integration --------------------------------------------------------
CREATE TABLE IF NOT EXISTS exams (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  description  TEXT
);

CREATE TABLE IF NOT EXISTS exam_subjects (
  exam_id      TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  subject_id   TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  order_index  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (exam_id, subject_id)
);
CREATE INDEX IF NOT EXISTS idx_examsubjects_subject ON exam_subjects(subject_id);

-- 3. Questions (flexible payload) --------------------------------------------
CREATE TABLE IF NOT EXISTS questions (
  id           TEXT PRIMARY KEY,
  exercise_id  TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('MCQ','MATCH','REORDER','TRANSLATE','COMPLETE')),
  prompt       TEXT NOT NULL,
  points       INTEGER NOT NULL DEFAULT 10,
  difficulty   TEXT NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy','medium','hard')),
  content      TEXT NOT NULL,           -- JSON payload
  explanation  TEXT
);
CREATE INDEX IF NOT EXISTS idx_questions_exercise ON questions(exercise_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);
