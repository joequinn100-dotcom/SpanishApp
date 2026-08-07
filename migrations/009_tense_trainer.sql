-- The tense trainer's attempt log.
--
-- Its own table rather than a row in `attempt`, for two reasons.
--
-- Structurally: `attempt` requires a `content_id` and a `session_id`, and a
-- trainer item has neither. The items are generated on demand from
-- `domain/conjugation.ts` and never stored, so there is no content row for a
-- foreign key to point at, and no session because the trainer is not one.
--
-- And deliberately: these attempts must not feed SPEC §4's mastery machines.
-- §4 is built so that promotion requires evidence spread over time and
-- gathered under the app's conditions — a planned session, a spaced review, an
-- unaided boss fight. Free practice that the learner chooses, repeats and
-- stops when bored is not that kind of evidence, and letting it into the
-- rolling accuracy would let a grind of twenty easy presents move a topic
-- toward `mastered`. Keeping the rows out of `attempt` makes that impossible
-- by construction rather than by remembering a WHERE clause.
--
-- What it is for: answering "which cells do I keep missing", which is a real
-- question and needs somewhere to look.

CREATE TABLE tense_attempt (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  verb          TEXT NOT NULL,           -- infinitive, e.g. 'entregar'
  tense         TEXT NOT NULL,           -- e.g. 'subj_imperfecto'
  person        TEXT NOT NULL,           -- 'yo' | 'tú' | 'él' | 'nosotros' | 'ellos'
  submitted     TEXT NOT NULL,
  correct       INTEGER NOT NULL,
  attempted_at  TEXT NOT NULL
);

-- The weak-cell query groups by (tense, person); the streak and daily-quest
-- reads filter by day.
CREATE INDEX idx_tense_cell ON tense_attempt(tense, person);
CREATE INDEX idx_tense_day ON tense_attempt(attempted_at);
