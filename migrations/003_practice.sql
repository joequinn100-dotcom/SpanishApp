-- Phase 2 — the practice loop.
--
-- Two changes, both documented in PHASE_2_NOTES.md:
--
--   1. `content.provenance` — SPEC §5 assumes every row in `content` arrived
--      through the gauntlet, so the column did not exist. Phase 2 ships with
--      authored drills so the runner has something to run before an API key
--      exists. Marking provenance is what keeps the invariant honest: the
--      gauntlet can later re-verify or replace every 'authored' row, and the
--      UI can say which is which. `gauntlet_score`/`gauntlet_log` are NOT NULL
--      in §2, so authored rows carry a score of 0 and a log recording that no
--      panel ran.
--
--   2. `attempt.item_index` and `session.plan_json` — a session is a planned
--      queue of items, not a stream. Resuming mid-session (Build Principle 4)
--      requires knowing which item you were on, and that has to survive a
--      process restart, so it lives here rather than in React state.

ALTER TABLE content ADD COLUMN provenance TEXT NOT NULL DEFAULT 'gauntlet'
  CHECK (provenance IN ('authored', 'gauntlet'));

-- Stable identity for authored rows so re-seeding updates them in place instead
-- of duplicating. Gauntlet-generated content leaves this NULL, and SQLite
-- permits any number of NULLs in a unique index.
ALTER TABLE content ADD COLUMN seed_key TEXT;
CREATE UNIQUE INDEX idx_content_seed_key ON content(seed_key);

-- The ordered item queue for a session, as JSON. Written once at session start.
ALTER TABLE session ADD COLUMN plan_json TEXT;
-- How far through that queue the user got. Advanced in the same transaction as
-- the attempt it belongs to, so the two can never disagree.
ALTER TABLE session ADD COLUMN cursor INTEGER NOT NULL DEFAULT 0;

-- Which planned slot an attempt answered. Lets a resumed session rebuild the
-- review screen without re-deriving order from timestamps.
ALTER TABLE attempt ADD COLUMN item_index INTEGER;

CREATE INDEX idx_content_error ON content(targets_error, retired);
CREATE INDEX idx_session_open ON session(ended_at, started_at);
