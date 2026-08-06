-- Phase 3 — transcript ingestion (SPEC §6).
--
-- §2 declared `transcript` and `transcript_finding` but §6 asks the pipeline for
-- things those columns cannot hold. Four additions, all documented in
-- PHASE_3_NOTES.md:
--
--   1. `transcript_finding.kind` — §6: "It must ALSO produce positive findings —
--      structures used correctly and unprompted." Those are what move errors to
--      resolved and topics to mastered, and they are not errors, so they cannot
--      share a table shape that assumes a correction.
--   2. `transcript_finding.systematic` — §6 asks the analysis to flag "whether it
--      looks systematic or like a one-off slip". That flag is what the One-off
--      button in the review UI is deciding about.
--   3. `transcript_finding.topic_id` — a positive finding is evidence about a
--      topic, not about an error code.
--   4. Provenance and audit columns, so a finding can say where it came from
--      (rules or a model) and when it was decided.

ALTER TABLE transcript_finding ADD COLUMN kind TEXT NOT NULL DEFAULT 'error'
  CHECK (kind IN ('error', 'positive'));

-- 1 = looks like a recurring pattern, 0 = looks like a slip, NULL = not judged.
ALTER TABLE transcript_finding ADD COLUMN systematic INTEGER;

ALTER TABLE transcript_finding ADD COLUMN topic_id TEXT REFERENCES topic(id);

-- 'rules' = deterministic detectors; 'model' = the §6 analysis call. Kept so a
-- finding never has to pretend it came from somewhere it did not.
ALTER TABLE transcript_finding ADD COLUMN provenance TEXT NOT NULL DEFAULT 'rules'
  CHECK (provenance IN ('rules', 'model'));

ALTER TABLE transcript_finding ADD COLUMN decided_at TEXT;

-- Character offset of the quote within the learner's segmented text. Lets the
-- review UI show the finding in its surroundings rather than stranded.
ALTER TABLE transcript_finding ADD COLUMN offset_start INTEGER;
ALTER TABLE transcript_finding ADD COLUMN offset_end INTEGER;

-- The segmented learner-only text (SPEC §6: "Lorena's speech is context, not
-- evidence"). Derived from raw_text, stored so findings' offsets stay valid.
ALTER TABLE transcript ADD COLUMN learner_text TEXT;
ALTER TABLE transcript ADD COLUMN title TEXT;
ALTER TABLE transcript ADD COLUMN reviewed_at TEXT;

CREATE INDEX idx_finding_pending ON transcript_finding(decision, kind);
