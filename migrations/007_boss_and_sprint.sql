-- Phase 4's two missing mechanics (SPEC §8, items 3 and 4).
--
-- The boss fight is not decoration. §8 makes it a gate on the same transition
-- §4 governs: "to move a topic from consolidating to mastered you must clear a
-- 12-item unaided challenge with no hints and no retries. Failing sends the
-- topic back to studying." Neither the gate nor the demotion existed, so a
-- topic could reach `mastered` — the app's strongest claim about the learner —
-- without ever being tested unaided in one sitting.
--
-- Reconciling the two sections: §4 requires two spaced reviews and one
-- spontaneous use; §8 requires the challenge. Both hold. The reviews and the
-- spontaneous use *unlock* the boss fight, and clearing it is the last step.
-- That ordering is the only one that makes both sections true at once, and it
-- puts the hardest evidence last, where the stakes belong.

ALTER TABLE topic_state ADD COLUMN boss_cleared_at TEXT;

-- ---------------------------------------------------------------------------
-- A boss fight and a Gauntlet Run ARE sessions.
--
-- Both are a queue of drills fixed at the start, answered one at a time,
-- graded, and worth XP. That is what `session` already is, down to `plan_json`
-- and `cursor`, and every consequence of an answer — the attempt row, the
-- rolling accuracy, the error state machine, the XP ledger — is already wired
-- to a session id. Giving the challenges their own parallel attempt path would
-- mean a second copy of that logic, and the copy would drift: the first thing
-- to rot would be error extinction, which is the whole point of §8 item 3.
--
-- So the `kind` CHECK has to widen, and SQLite cannot alter a CHECK in place.
-- Hence the table rebuild, and hence the marker below: it tells the runner to
-- drop foreign-key enforcement for the length of this file and to replace it
-- with a full `foreign_key_check` before committing. Without it the commit
-- fails outright — dropping the parent counts one deferred violation per child
-- row and restoring the table does not clear them.
-- ---------------------------------------------------------------------------

-- fluencia:rebuild-tables

CREATE TABLE session_new (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at    TEXT NOT NULL,
  ended_at      TEXT,
  kind          TEXT NOT NULL CHECK (kind IN ('self_study','transcript_review','exam_sim','boss','sprint')),
  topics        TEXT,
  xp_earned     INTEGER DEFAULT 0,
  handoff_json  TEXT,
  handoff_md    TEXT,
  plan_json     TEXT,
  cursor        INTEGER NOT NULL DEFAULT 0
);

INSERT INTO session_new
  (id, started_at, ended_at, kind, topics, xp_earned, handoff_json, handoff_md, plan_json, cursor)
SELECT
   id, started_at, ended_at, kind, topics, xp_earned, handoff_json, handoff_md, plan_json, cursor
  FROM session;

DROP TABLE session;
ALTER TABLE session_new RENAME TO session;

CREATE INDEX idx_session_open ON session(ended_at, started_at);

-- ---------------------------------------------------------------------------
-- The challenge-specific columns, one row per run, hanging off the session.
-- ---------------------------------------------------------------------------

-- Every attempt, not just the successful one. A topic that took four goes to
-- clear is a different picture from one that cleared first time, and the
-- timeline projection should not be able to pretend otherwise.
CREATE TABLE boss_attempt (
  session_id    INTEGER PRIMARY KEY REFERENCES session(id),
  topic_id      TEXT NOT NULL REFERENCES topic(id),
  started_at    TEXT NOT NULL,
  ended_at      TEXT,
  correct       INTEGER NOT NULL DEFAULT 0,
  passed        INTEGER                  -- null while in progress
);

CREATE INDEX idx_boss_topic ON boss_attempt(topic_id, started_at);

-- The Gauntlet Run (§8 item 3): a timed ten-item sprint drawn only from the
-- active error list, three lives, scored against the learner's own past runs.
--
-- Named `sprint` in the schema and the code deliberately. §5's verification
-- panel is also called the gauntlet, and two unrelated things sharing a name in
-- the same codebase is how the wrong one gets called at three in the morning.
-- The user-facing label stays "Gauntlet Run".
CREATE TABLE sprint_run (
  session_id    INTEGER PRIMARY KEY REFERENCES session(id),
  started_at    TEXT NOT NULL,
  ended_at      TEXT,
  correct       INTEGER NOT NULL DEFAULT 0,
  lives_left    INTEGER NOT NULL,
  duration_ms   INTEGER,
  outcome       TEXT CHECK (outcome IN ('cleared', 'out_of_lives', 'abandoned'))
);

-- The leaderboard reads finished runs ordered by time, so it is served from
-- the index rather than a scan that grows with every run ever played.
CREATE INDEX idx_sprint_finished ON sprint_run(outcome, duration_ms);
