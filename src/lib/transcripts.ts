import 'server-only';
import { tx } from '@/db';
import { db } from './queries';
import { analyze, wordCount, type Finding } from '@/domain/detectors';
import { segment, speakers, learnerTurns, flatten } from '@/domain/transcript';
import { errorTransition, topicTransition, newErrorState, newTopicState } from '@/domain/mastery';
import { markVocabSpontaneous, vocabUsedIn } from './vocab';
import type { ErrorStatus, TopicStatus } from '@/domain/mastery';

/**
 * Transcript ingestion (SPEC §6).
 *
 * The governing rule, from CLAUDE.md: "Never auto-apply a transcript finding.
 * Findings are proposed; the user confirms." So this file has two halves that
 * never touch each other — `ingest` writes only to `transcript` and
 * `transcript_finding`, and `decide` is the only thing that can move the error
 * log or a topic's state, and only when a human presses a button.
 */

export interface TranscriptRow {
  id: number;
  source: string;
  class_date: string;
  raw_text: string;
  learner_text: string | null;
  title: string | null;
  analysis_json: string | null;
  imported_at: string;
  reviewed_at: string | null;
}

export interface FindingRow {
  id: number;
  transcript_id: number;
  kind: 'error' | 'positive';
  error_code: string | null;
  topic_id: string | null;
  proposed_label: string | null;
  quote: string;
  correction: string;
  explanation: string;
  confidence: number;
  systematic: number | null;
  provenance: string;
  decision: 'pending' | 'accepted' | 'rejected' | 'one_off';
  decided_at: string | null;
}

/* ------------------------------------------------------------------ *
 * Preview — what the upload box shows before you commit
 * ------------------------------------------------------------------ */

export interface Preview {
  speakers: { name: string; turns: number; chars: number }[];
}

/**
 * Who is in this transcript, with how much each said.
 *
 * No guess at which one is the learner. The obvious heuristic — the teacher
 * talks more — does not hold for a conversation class, and a plausible-looking
 * default that goes unchecked is worse than no default at all.
 */
export function preview(raw: string): Preview {
  return { speakers: speakers(segment(raw)) };
}

/* ------------------------------------------------------------------ *
 * Ingest
 * ------------------------------------------------------------------ */

export interface IngestResult {
  transcriptId: number;
  learnerWords: number;
  errors: number;
  positives: number;
  /** Words that reached `spontaneous` because they appeared in your own speech. */
  vocabPromoted: number;
}

/**
 * Store a transcript and its proposed findings.
 *
 * Nothing in the error log moves here. Every finding lands as `pending`.
 */
export function ingest(input: {
  raw: string;
  learner: string | null;
  source: 'lorena' | 'self_recording' | 'other';
  classDate: string;
  title?: string;
}): IngestResult {
  const database = db();
  const turns = learnerTurns(segment(input.raw), input.learner);
  const { text } = flatten(turns);
  const findings = analyze(text);
  const now = new Date().toISOString();

  return tx(database, () => {
    const info = database
      .prepare(
        `INSERT INTO transcript (source, class_date, raw_text, learner_text, title,
                                 analysis_json, imported_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        input.source,
        input.classDate,
        input.raw,
        text,
        input.title ?? null,
        JSON.stringify({
          analyzer: 'rules',
          learner: input.learner,
          learner_words: wordCount(text),
          turns: turns.length,
          vocab_used: vocabUsedIn(text),
        }),
        now,
      );

    const id = Number(info.lastInsertRowid);
    const known = new Set(
      (database.prepare('SELECT code FROM error').all() as { code: string }[]).map((r) => r.code),
    );
    const knownTopics = new Set(
      (database.prepare('SELECT id FROM topic').all() as { id: string }[]).map((r) => r.id),
    );

    const stmt = database.prepare(
      `INSERT INTO transcript_finding
         (transcript_id, kind, error_code, topic_id, proposed_label, quote, correction,
          explanation, confidence, systematic, provenance, decision)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'rules', 'pending')`,
    );

    let errors = 0;
    let positives = 0;
    for (const f of findings) {
      // A rule can name a code the log does not carry; store it as a proposed
      // label instead of a foreign key so the row is still reviewable.
      const code = f.errorCode && known.has(f.errorCode) ? f.errorCode : null;
      stmt.run(
        id,
        f.kind,
        code,
        f.topicId && knownTopics.has(f.topicId) ? f.topicId : null,
        code ? null : f.errorCode,
        f.quote,
        f.correction,
        f.explanation,
        f.confidence,
        f.systematic === null ? null : f.systematic ? 1 : 0,
      );
      if (f.kind === 'error') errors++;
      else positives++;
    }

    // Vocabulary used unprompted in the learner's own turns. This is the only
    // route to the top stage: SM-2 can prove you recall a word on demand, and
    // §4's standard is that recall is not use.
    const vocabPromoted = markVocabSpontaneous(vocabUsedIn(text));

    return { transcriptId: id, learnerWords: wordCount(text), errors, positives, vocabPromoted };
  });
}

/* ------------------------------------------------------------------ *
 * Reading
 * ------------------------------------------------------------------ */

export function allTranscripts(): (TranscriptRow & { pending: number; total: number })[] {
  return db()
    .prepare(
      `SELECT t.*,
              (SELECT count(*) FROM transcript_finding f
                WHERE f.transcript_id = t.id AND f.decision = 'pending') AS pending,
              (SELECT count(*) FROM transcript_finding f
                WHERE f.transcript_id = t.id) AS total
         FROM transcript t
        ORDER BY t.class_date DESC, t.id DESC`,
    )
    .all() as (TranscriptRow & { pending: number; total: number })[];
}

export function transcriptById(id: number): TranscriptRow | undefined {
  return db().prepare('SELECT * FROM transcript WHERE id = ?').get(id) as
    | TranscriptRow
    | undefined;
}

export function findingsFor(id: number): FindingRow[] {
  return db()
    .prepare(
      `SELECT * FROM transcript_finding
        WHERE transcript_id = ?
        ORDER BY CASE decision WHEN 'pending' THEN 0 ELSE 1 END,
                 CASE kind WHEN 'error' THEN 0 ELSE 1 END,
                 confidence DESC, id`,
    )
    .all(id) as FindingRow[];
}

/** Total pending review across all transcripts — the home page badge. */
export function pendingCount(): number {
  const r = db()
    .prepare("SELECT count(*) AS n FROM transcript_finding WHERE decision = 'pending'")
    .get() as { n: number };
  return r.n;
}

/* ------------------------------------------------------------------ *
 * Deciding — the only path that writes learning state
 * ------------------------------------------------------------------ */

export type Decision = 'accepted' | 'rejected' | 'one_off';

/**
 * Apply a human decision to one finding.
 *
 * - **Accept** — real evidence. An error finding logs a `committed` event and
 *   advances the error machine; a positive finding logs `spontaneous_ok`, which
 *   is the evidence §4 requires before anything can reach `resolved` or
 *   `mastered`.
 * - **One-off** — it happened, but it is a slip rather than a pattern. The
 *   event is recorded so the history is complete, and the error state is left
 *   alone. This is the button that stops a bad day from poisoning the log.
 * - **Reject** — the analysis is wrong. Nothing is recorded at all.
 */
export function decide(findingId: number, decision: Decision): void {
  const database = db();
  tx(database, () => {
    const f = database
      .prepare("SELECT * FROM transcript_finding WHERE id = ? AND decision = 'pending'")
      .get(findingId) as FindingRow | undefined;
    if (!f) return;

    const now = new Date().toISOString();
    database
      .prepare('UPDATE transcript_finding SET decision = ?, decided_at = ? WHERE id = ?')
      .run(decision, now, findingId);

    if (decision === 'rejected') return;

    if (f.kind === 'error' && f.error_code) {
      applyErrorFinding(f, decision, now);
    } else if (f.kind === 'positive' && decision === 'accepted') {
      applyPositiveFinding(f, now);
    }
  });
}

function applyErrorFinding(f: FindingRow, decision: Decision, now: string) {
  const database = db();
  const row = database
    .prepare(
      `SELECT id, status, severity, occurrences, clean_streak, spontaneous_ok,
              last_occurred, consolidating_since, resolved_at, topic_id
         FROM error WHERE code = ?`,
    )
    .get(f.error_code) as
    | {
        id: number;
        status: ErrorStatus;
        severity: number;
        occurrences: number;
        clean_streak: number;
        spontaneous_ok: number;
        last_occurred: string | null;
        consolidating_since: string | null;
        resolved_at: string | null;
        topic_id: string | null;
      }
    | undefined;
  if (!row) return;

  // The event is logged for both Accept and One-off: it did happen, and a
  // history with holes in it is worse than one with a slip marked as a slip.
  database
    .prepare(
      `INSERT INTO error_event (error_id, session_id, source, outcome, evidence, occurred_at)
       VALUES (?, NULL, 'transcript', 'committed', ?, ?)`,
    )
    .run(row.id, f.quote, now);

  if (decision === 'one_off') return;

  const after = errorTransition(
    {
      ...newErrorState(row.severity, row.status),
      occurrences: row.occurrences,
      cleanStreak: row.clean_streak,
      spontaneousOk: row.spontaneous_ok,
      lastOccurred: row.last_occurred,
      consolidatingSince: row.consolidating_since,
      resolvedAt: row.resolved_at,
    },
    { type: 'committed' },
    now,
  );

  database
    .prepare(
      `UPDATE error SET status = ?, occurrences = ?, clean_streak = ?, last_occurred = ?,
                        consolidating_since = ?, resolved_at = ?
        WHERE id = ?`,
    )
    .run(
      after.status,
      after.occurrences,
      after.cleanStreak,
      after.lastOccurred,
      after.consolidatingSince,
      after.resolvedAt,
      row.id,
    );

  // §4: a transcript error also drops a mastered topic back to studying. The
  // topic comes from the error's own row — an error finding names a code, and
  // the code is what knows which topic it belongs to.
  const topic = f.topic_id ?? row.topic_id;
  if (topic) applyTopicEvent(topic, 'transcript_error', now);
}

function applyPositiveFinding(f: FindingRow, now: string) {
  const database = db();

  if (f.error_code) {
    const row = database
      .prepare(
        `SELECT id, status, severity, occurrences, clean_streak, spontaneous_ok,
                last_occurred, consolidating_since, resolved_at
           FROM error WHERE code = ?`,
      )
      .get(f.error_code) as
      | {
          id: number;
          status: ErrorStatus;
          severity: number;
          occurrences: number;
          clean_streak: number;
          spontaneous_ok: number;
          last_occurred: string | null;
          consolidating_since: string | null;
          resolved_at: string | null;
        }
      | undefined;

    if (row) {
      database
        .prepare(
          `INSERT INTO error_event (error_id, session_id, source, outcome, evidence, occurred_at)
           VALUES (?, NULL, 'transcript', 'avoided', ?, ?)`,
        )
        .run(row.id, f.quote, now);

      const after = errorTransition(
        {
          ...newErrorState(row.severity, row.status),
          occurrences: row.occurrences,
          cleanStreak: row.clean_streak,
          spontaneousOk: row.spontaneous_ok,
          lastOccurred: row.last_occurred,
          consolidatingSince: row.consolidating_since,
          resolvedAt: row.resolved_at,
        },
        { type: 'spontaneous_ok' },
        now,
      );

      database
        .prepare(
          `UPDATE error SET status = ?, clean_streak = ?, spontaneous_ok = ?,
                            consolidating_since = ?, resolved_at = ?
            WHERE id = ?`,
        )
        .run(
          after.status,
          after.cleanStreak,
          after.spontaneousOk,
          after.consolidatingSince,
          after.resolvedAt,
          row.id,
        );
    }
  }

  if (f.topic_id) applyTopicEvent(f.topic_id, 'spontaneous_use', now);
}

function applyTopicEvent(topicId: string, type: 'spontaneous_use' | 'transcript_error', now: string) {
  const database = db();
  const row = database
    .prepare(
      `SELECT status, accuracy, attempts, correct, spontaneous, first_seen, last_seen,
              mastered_at, consolidating_since, reviews_passed, next_review_at
         FROM topic_state WHERE topic_id = ?`,
    )
    .get(topicId) as
    | {
        status: TopicStatus;
        accuracy: number;
        attempts: number;
        correct: number;
        spontaneous: number;
        first_seen: string | null;
        last_seen: string | null;
        mastered_at: string | null;
        consolidating_since: string | null;
        reviews_passed: number;
        next_review_at: string | null;
      }
    | undefined;
  if (!row) return;

  const after = topicTransition(
    {
      ...newTopicState(row.status),
      accuracy: row.accuracy,
      attempts: row.attempts,
      correct: row.correct,
      spontaneous: row.spontaneous,
      firstSeen: row.first_seen,
      lastSeen: row.last_seen,
      masteredAt: row.mastered_at,
      consolidatingSince: row.consolidating_since,
      reviewsPassed: row.reviews_passed,
      nextReviewAt: row.next_review_at,
    },
    { type },
    now,
  );

  database
    .prepare(
      `UPDATE topic_state SET status = ?, spontaneous = ?, mastered_at = ?,
                              consolidating_since = ?, reviews_passed = ?, next_review_at = ?
        WHERE topic_id = ?`,
    )
    .run(
      after.status,
      after.spontaneous,
      after.masteredAt,
      after.consolidatingSince,
      after.reviewsPassed,
      after.nextReviewAt,
      topicId,
    );
}

/** Mark the review finished once nothing is pending. */
export function closeReview(transcriptId: number): void {
  const database = db();
  const left = database
    .prepare(
      "SELECT count(*) AS n FROM transcript_finding WHERE transcript_id = ? AND decision = 'pending'",
    )
    .get(transcriptId) as { n: number };
  if (left.n === 0) {
    database
      .prepare('UPDATE transcript SET reviewed_at = ? WHERE id = ? AND reviewed_at IS NULL')
      .run(new Date().toISOString(), transcriptId);
  }
}

/* ------------------------------------------------------------------ *
 * "What to raise with Lorena" (SPEC §6)
 * ------------------------------------------------------------------ */

export interface ForLorena {
  code: string;
  label: string;
  why: string;
}

/**
 * The three things the app cannot fix alone.
 *
 * §6 asks for exactly this list, and the selection criterion is not "worst
 * errors" — it is errors whose evidence is written-only. An error you avoid in
 * drills but commit in speech needs live spoken correction, and that is the one
 * thing a text app cannot provide.
 */
export function forLorena(transcriptId: number, limit = 3): ForLorena[] {
  return db()
    .prepare(
      `SELECT e.code AS code, e.label_en AS label, e.severity, e.clean_streak,
              count(f.id) AS hits
         FROM transcript_finding f
         JOIN error e ON e.code = f.error_code
        WHERE f.transcript_id = ?
          AND f.kind = 'error'
          AND f.decision = 'accepted'
        GROUP BY e.code
        ORDER BY e.clean_streak DESC, e.severity DESC, hits DESC
        LIMIT ?`,
    )
    .all(transcriptId, limit)
    .map((r) => {
      const row = r as { code: string; label: string; severity: number; clean_streak: number; hits: number };
      return {
        code: row.code,
        label: row.label,
        why:
          row.clean_streak > 0
            ? `Clean in ${row.clean_streak} written drills but committed ${row.hits}× in speech — it needs live correction, not more typing.`
            : `Committed ${row.hits}× in this class at severity ${row.severity}. Ask her to push you into contexts that force it.`,
      };
    });
}
