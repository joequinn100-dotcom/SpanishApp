-- The overnight pre-generation job (SPEC §5, cost control).
--
-- §5: "Pre-generate overnight. A background job fills the content pool for the
-- next 3 recommended topics while you sleep. Sessions should never wait on
-- generation."
--
-- A job that runs while nobody is watching needs a record, or its failure mode
-- is silence: the pool simply stays empty and the first anyone knows is a
-- session with no material in it. Every run writes a row whether it succeeded,
-- found nothing to do, or died on a rate limit.
--
-- Cost is recorded per run because §5 is explicit that this is where naive
-- implementations get expensive, and a number nobody records is a number
-- nobody notices growing.

CREATE TABLE pregeneration_run (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at    TEXT NOT NULL,
  ended_at      TEXT,
  -- 'ok' | 'nothing_to_do' | 'no_api_key' | 'failed'
  outcome       TEXT,
  topics        TEXT,                    -- JSON: the topics attempted
  accepted      INTEGER NOT NULL DEFAULT 0,
  quarantined   INTEGER NOT NULL DEFAULT 0,
  batches       INTEGER NOT NULL DEFAULT 0,
  error         TEXT
);

CREATE INDEX idx_pregeneration_started ON pregeneration_run(started_at);
