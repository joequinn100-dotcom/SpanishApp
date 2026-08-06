-- Fluencia v2 — initial schema.
--
-- SPEC.md §2, with four documented additions (see PHASE_1_NOTES.md):
--   1. `quarantine`            — §5's arbiter writes here; §2 never defined it.
--   2. topic_state review cols — §4's "2 clean spaced reviews (+3d, +10d)" gate
--                                is unimplementable without them.
--   3. topic.no_schedule       — §3 lists por/para as a topic, §10 says never
--                                schedule it. Seed it, exclude it from routing.
--   4. FK-safe table order     — §2 references session() before declaring it.
--
-- No BEGIN/COMMIT here: the migration runner owns the transaction.

-- ============ CURRICULUM ============

CREATE TABLE level (
  id            TEXT PRIMARY KEY,        -- 'A1','A2','B1','B2','C1','C2'
  ordinal       INTEGER NOT NULL
);

CREATE TABLE strand (
  id            TEXT PRIMARY KEY,
  name_en       TEXT NOT NULL,
  name_es       TEXT NOT NULL
);

CREATE TABLE topic (
  id            TEXT PRIMARY KEY,        -- 'b2.mood.subj_imperfecto'
  slug          TEXT UNIQUE NOT NULL,
  name_en       TEXT NOT NULL,
  name_es       TEXT NOT NULL,
  level_id      TEXT NOT NULL REFERENCES level(id),
  strand_id     TEXT NOT NULL REFERENCES strand(id),
  summary       TEXT NOT NULL,           -- one paragraph, what it is & why it matters
  book_ref      TEXT,                    -- 'Breakthrough U7', NULL when unsourced
  est_minutes   INTEGER DEFAULT 25,
  search_terms  TEXT NOT NULL,           -- pipe-delimited aliases for search
  -- ADDITION 3: excluded from recommendation, still searchable and drillable.
  no_schedule   INTEGER NOT NULL DEFAULT 0
);

-- The dependency graph. THIS is what produces "start with X, then Y, then Z".
CREATE TABLE topic_prereq (
  topic_id      TEXT NOT NULL REFERENCES topic(id),
  prereq_id     TEXT NOT NULL REFERENCES topic(id),
  strength      TEXT NOT NULL CHECK (strength IN ('hard','soft')),
  PRIMARY KEY (topic_id, prereq_id)
);

CREATE INDEX idx_prereq_topic  ON topic_prereq(topic_id);
CREATE INDEX idx_prereq_prereq ON topic_prereq(prereq_id);

-- ============ SESSIONS (declared early: FK target for several tables) ============

CREATE TABLE session (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at    TEXT NOT NULL,
  ended_at      TEXT,
  kind          TEXT NOT NULL CHECK (kind IN ('self_study','transcript_review','exam_sim')),
  topics        TEXT,                    -- JSON array
  xp_earned     INTEGER DEFAULT 0,
  handoff_json  TEXT,
  handoff_md    TEXT
);

-- ============ USER STATE ============

CREATE TABLE topic_state (
  topic_id      TEXT PRIMARY KEY REFERENCES topic(id),
  status        TEXT NOT NULL DEFAULT 'locked'
                CHECK (status IN ('locked','available','studying','consolidating','mastered')),
  accuracy      REAL DEFAULT 0,          -- rolling over the last 20 attempts, NOT correct/attempts
  attempts      INTEGER DEFAULT 0,       -- lifetime
  correct       INTEGER DEFAULT 0,       -- lifetime
  first_seen    TEXT,
  last_seen     TEXT,
  mastered_at   TEXT,
  spontaneous   INTEGER DEFAULT 0,       -- correct uses found in transcripts
  -- ADDITION 2: the consolidating → mastered gate needs a review schedule.
  consolidating_since TEXT,
  reviews_passed      INTEGER NOT NULL DEFAULT 0,
  next_review_at      TEXT
);

CREATE TABLE error (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  code          TEXT UNIQUE NOT NULL,    -- 'noun.greek_ma'
  label_en      TEXT NOT NULL,
  wrong_example TEXT NOT NULL,
  right_example TEXT NOT NULL,
  rule          TEXT NOT NULL,           -- thorough: the rule, the why, the exceptions
  topic_id      TEXT REFERENCES topic(id),
  severity      INTEGER NOT NULL CHECK (severity BETWEEN 1 AND 5),
  status        TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active','improving','consolidating','resolved','regressed')),
  first_logged  TEXT NOT NULL,
  last_occurred TEXT,
  occurrences   INTEGER DEFAULT 0,       -- times committed
  clean_streak  INTEGER DEFAULT 0,       -- consecutive correct productions
  spontaneous_ok INTEGER DEFAULT 0,      -- correct uses in unprompted transcript speech
  consolidating_since TEXT,              -- start of the 21-day silent window
  resolved_at   TEXT
);

CREATE INDEX idx_error_status ON error(status);

CREATE TABLE error_event (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  error_id      INTEGER NOT NULL REFERENCES error(id),
  session_id    INTEGER REFERENCES session(id),
  source        TEXT NOT NULL CHECK (source IN ('drill','transcript','freewrite','roleplay')),
  outcome       TEXT NOT NULL CHECK (outcome IN ('committed','avoided')),
  evidence      TEXT NOT NULL,           -- the actual sentence
  occurred_at   TEXT NOT NULL
);

CREATE INDEX idx_error_event_error ON error_event(error_id, occurred_at);

-- ============ CONTENT (gauntlet-verified) ============

CREATE TABLE content (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id      TEXT NOT NULL REFERENCES topic(id),
  kind          TEXT NOT NULL CHECK (kind IN (
                  'explanation','drill_conjugation','drill_cloze','drill_transform',
                  'drill_translate','drill_error_spot','roleplay','upgrade_pair')),
  difficulty    INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  payload       TEXT NOT NULL,           -- JSON, shape depends on kind
  targets_error TEXT REFERENCES error(code),
  gauntlet_score REAL NOT NULL,
  gauntlet_log  TEXT NOT NULL,           -- JSON: every round's critiques
  verified_at   TEXT NOT NULL,
  retired       INTEGER DEFAULT 0
);

CREATE INDEX idx_content_topic ON content(topic_id, retired);

-- ADDITION 1: §5's arbiter quarantines content that fails 3 rounds. Never shown
-- to the user; surfaced in an admin view so a systematic generator fault is
-- visible rather than silently discarded.
CREATE TABLE quarantine (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id      TEXT REFERENCES topic(id),
  kind          TEXT NOT NULL,
  payload       TEXT NOT NULL,           -- the last candidate
  gauntlet_log  TEXT NOT NULL,           -- JSON: all rounds, all three verifiers
  rounds_used   INTEGER NOT NULL,
  final_score   REAL,
  reason        TEXT NOT NULL,
  quarantined_at TEXT NOT NULL
);

CREATE TABLE attempt (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  content_id    INTEGER NOT NULL REFERENCES content(id),
  session_id    INTEGER NOT NULL REFERENCES session(id),
  user_answer   TEXT NOT NULL,
  correct       INTEGER NOT NULL,
  partial       REAL,                    -- 0..1 for free-response
  feedback      TEXT NOT NULL,
  errors_found  TEXT,                    -- JSON array of error codes
  latency_ms    INTEGER,                 -- feeds the SPEED phase later
  attempted_at  TEXT NOT NULL
);

CREATE INDEX idx_attempt_session ON attempt(session_id);
CREATE INDEX idx_attempt_content ON attempt(content_id, attempted_at);

-- ============ TRANSCRIPTS ============

CREATE TABLE transcript (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  source        TEXT NOT NULL CHECK (source IN ('lorena','self_recording','other')),
  class_date    TEXT NOT NULL,
  raw_text      TEXT NOT NULL,
  analysis_json TEXT,                    -- gauntlet-verified analysis
  imported_at   TEXT NOT NULL
);

-- Findings are PROPOSED, not auto-applied. Manual confirmation prevents
-- one-off slips from polluting the log.
CREATE TABLE transcript_finding (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  transcript_id INTEGER NOT NULL REFERENCES transcript(id),
  error_code    TEXT,                    -- null = novel error, needs a new code
  proposed_label TEXT,
  quote         TEXT NOT NULL,
  correction    TEXT NOT NULL,
  explanation   TEXT NOT NULL,
  confidence    REAL NOT NULL,
  decision      TEXT NOT NULL DEFAULT 'pending'
                CHECK (decision IN ('pending','accepted','rejected','one_off'))
);

CREATE INDEX idx_finding_transcript ON transcript_finding(transcript_id, decision);

-- ============ VOCAB ============

CREATE TABLE vocab (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  term          TEXT UNIQUE NOT NULL,
  gloss_en      TEXT NOT NULL,
  category      TEXT NOT NULL CHECK (category IN (
                  'connector','work_noun','verb_pattern','collocation',
                  'set_phrase','false_friend')),
  level_id      TEXT NOT NULL REFERENCES level(id),
  example_es    TEXT NOT NULL,           -- must be construction/consulting context
  stage         TEXT NOT NULL DEFAULT 'new'
                CHECK (stage IN ('new','recognizing','using','spontaneous')),
  ease          REAL DEFAULT 2.5,        -- SM-2
  interval_days INTEGER DEFAULT 0,
  due_at        TEXT
);

-- ============ GAMIFICATION ============

CREATE TABLE streak (
  id            INTEGER PRIMARY KEY CHECK (id = 1),
  current       INTEGER DEFAULT 0,
  longest       INTEGER DEFAULT 0,
  last_active   TEXT,
  freezes       INTEGER DEFAULT 2,
  freezes_reset_at TEXT                  -- "2 per month" needs a reset anchor
);

CREATE TABLE xp_event (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id    INTEGER REFERENCES session(id),
  amount        INTEGER NOT NULL,
  reason        TEXT NOT NULL,
  occurred_at   TEXT NOT NULL
);

CREATE TABLE achievement (
  code          TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT NOT NULL,
  unlocked_at   TEXT
);
