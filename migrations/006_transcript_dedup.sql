-- Duplicate transcripts.
--
-- Found by uploading real class recordings: of nine files supplied across two
-- batches, three were byte-identical to earlier ones under different names
-- (Class_2 / Spanish_Class_6, untitled / Transcript2, untitled_2 /
-- Transcript_1). That is the normal shape of a folder of exports, not a mistake
-- worth scolding the user for — but ingesting the same class twice doubles
-- every error count drawn from it, and SPEC §4 weights errors by
-- log(1 + occurrences). A duplicate would quietly move a topic up the
-- recommendation order on the strength of one class counted twice.
--
-- The hash is over the extracted text rather than the file bytes, so the same
-- class re-exported to a different format is still caught, and so a PDF whose
-- only difference is metadata does not read as new.

ALTER TABLE transcript ADD COLUMN content_hash TEXT;

-- Not UNIQUE: the column is nullable for the rows that predate this migration,
-- and SQLite would otherwise treat every NULL as distinct anyway. Uniqueness is
-- enforced in the ingest path, which can give a useful answer ("this is the
-- class you imported on the 3rd") instead of a constraint error.
CREATE INDEX idx_transcript_hash ON transcript(content_hash);
