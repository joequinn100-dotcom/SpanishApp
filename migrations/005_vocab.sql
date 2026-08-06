-- Vocabulary SRS.
--
-- §2 declared `vocab` with the SM-2 fields (ease, interval_days, due_at) but
-- not the counters the algorithm needs to distinguish "new" from "leaky":
--
--   `reps`   — consecutive successful recalls, which is what selects SM-2's
--              interval step. Without it, every review looks like the first.
--   `lapses` — how often a *known* word was forgotten. Not cosmetic: a word
--              with a high lapse count is one the schedule taught rather than
--              one you actually use, and it should be seen.
--   `last_reviewed` — so the vocab page can show what happened when.
--
-- `seed_key` mirrors migration 003's approach for content: authored rows are
-- updated in place on re-seed rather than duplicated, which keeps a learner's
-- ease and due date attached to the word across seed changes.

ALTER TABLE vocab ADD COLUMN reps INTEGER NOT NULL DEFAULT 0;
ALTER TABLE vocab ADD COLUMN lapses INTEGER NOT NULL DEFAULT 0;
ALTER TABLE vocab ADD COLUMN last_reviewed TEXT;

CREATE INDEX idx_vocab_due ON vocab(due_at, stage);

-- Every review, kept as its own row so the schedule can be reconstructed and
-- so a word's history survives the state being overwritten.
CREATE TABLE vocab_review (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  vocab_id      INTEGER NOT NULL REFERENCES vocab(id),
  session_id    INTEGER REFERENCES session(id),
  recall        TEXT NOT NULL CHECK (recall IN ('again','good','easy')),
  -- Interval and ease AFTER the review, so a row explains the next due date.
  interval_days INTEGER NOT NULL,
  ease          REAL NOT NULL,
  reviewed_at   TEXT NOT NULL
);

CREATE INDEX idx_vocab_review_word ON vocab_review(vocab_id, reviewed_at);
