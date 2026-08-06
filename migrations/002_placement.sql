-- Placement (Phase 2).
--
-- SPEC §4 is built on the principle that mastery requires evidence: spaced
-- reviews plus spontaneous correct use. Manual placement is a different claim —
-- prior knowledge acquired outside the app — and conflating the two would make
-- the timeline lie about how mastery was earned.
--
-- So placement is recorded distinctly. A topic marked here counts as mastered
-- for unlocking purposes (it genuinely is), but the flag survives so a later
-- view can separate "proved it here" from "declared at placement", and so a
-- regression can tell the difference.

ALTER TABLE topic_state ADD COLUMN placed_manually INTEGER NOT NULL DEFAULT 0;
ALTER TABLE topic_state ADD COLUMN placed_at TEXT;
