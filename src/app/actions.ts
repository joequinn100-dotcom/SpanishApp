'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { tx } from '@/db';
import { db } from '@/lib/queries';
import { recomputeAvailability } from '@/seed';
import { startSession, submitAnswer, openSession } from '@/lib/practice';
import { finishSession } from '@/lib/handoff';
import { abandonChallenge, startBoss, startSprint } from '@/lib/challenge';
import { closeReview, decide, ingest, preview, type Decision } from '@/lib/transcripts';
import { reviewCard } from '@/lib/vocab';
import type { Recall } from '@/domain/srs';
import type { TopicStatus } from '@/domain/mastery';

/**
 * Placement actions (Phase 2).
 *
 * These write mastery state directly, which is the one place in the app that
 * bypasses SPEC §4's evidence requirement. That is deliberate and bounded: the
 * learner is declaring knowledge acquired before the app existed, not claiming
 * to have proved it here. Every such write sets `placed_manually` so the two
 * are never confused downstream.
 */

const PLACEABLE: TopicStatus[] = ['locked', 'available', 'studying', 'mastered'];

function apply(ids: string[], status: TopicStatus) {
  const database = db();
  tx(database, () => {
    const now = new Date().toISOString();
    const mastered = status === 'mastered';
    const stmt = database.prepare(
      `UPDATE topic_state
          SET status = ?,
              mastered_at = CASE WHEN ? = 1 THEN COALESCE(mastered_at, ?) ELSE NULL END,
              placed_manually = ?,
              placed_at = CASE WHEN ? = 1 THEN ? ELSE placed_at END,
              first_seen = COALESCE(first_seen, CASE WHEN ? = 1 THEN ? ELSE NULL END),
              consolidating_since = NULL,
              reviews_passed = 0,
              next_review_at = NULL
        WHERE topic_id = ?`,
    );
    for (const id of ids) {
      stmt.run(status, mastered ? 1 : 0, now, mastered ? 1 : 0, mastered ? 1 : 0, now,
               mastered ? 1 : 0, now, id);
    }
    // Marking one topic mastered can unlock several others.
    recomputeAvailability(database);
  });

  revalidatePath('/', 'layout');
}

export async function setTopicStatus(topicId: string, status: string) {
  if (!PLACEABLE.includes(status as TopicStatus)) {
    throw new Error(`Not a placeable status: ${status}`);
  }
  apply([topicId], status as TopicStatus);
}

/** Bulk placement — "I own all of A1" is one click, not fifteen. */
export async function setLevelStatus(level: string, status: string) {
  if (!PLACEABLE.includes(status as TopicStatus)) {
    throw new Error(`Not a placeable status: ${status}`);
  }
  const ids = (
    db().prepare('SELECT id FROM topic WHERE level_id = ?').all(level) as { id: string }[]
  ).map((r) => r.id);
  apply(ids, status as TopicStatus);
}

/** Undo the lot: back to a cold start, availability recomputed from the graph. */
export async function resetPlacement() {
  const database = db();
  tx(database, () => {
    database
      .prepare(
        `UPDATE topic_state
            SET status = 'locked', mastered_at = NULL, placed_manually = 0, placed_at = NULL,
                consolidating_since = NULL, reviews_passed = 0, next_review_at = NULL
          WHERE placed_manually = 1 OR status <> 'locked'`,
      )
      .run();
    recomputeAvailability(database);
  });
  revalidatePath('/', 'layout');
}

/* ------------------------------------------------------------------ *
 * Practice loop (Phase 2)
 * ------------------------------------------------------------------ */

/**
 * Open a session, or resume the one already running.
 *
 * `startSession` is idempotent by design — clicking "Start" twice must not
 * produce two open sessions, because the cursor lives on the session row and
 * two cursors would mean two truths about where you are.
 */
export async function beginSession(focusTopicId?: string | null) {
  const s = startSession(focusTopicId ?? null);
  revalidatePath('/', 'layout');
  redirect(`/practice/${s.id}`);
}

/**
 * Grade one answer. Every consequence is written in the same transaction.
 *
 * Deliberately does NOT revalidate. The cursor has already advanced in SQLite,
 * so revalidating would swap the item under the learner's feet and unmount the
 * feedback they are still reading. The runner refreshes on "Next" instead,
 * which is the moment the new item is actually wanted.
 */
export async function answer(sessionId: number, submitted: string, latencyMs?: number) {
  return submitAnswer(sessionId, submitted, latencyMs);
}

/** End the session and write the SPEC §7 handoff to disk and to the row. */
export async function endSession(sessionId: number) {
  finishSession(sessionId);
  revalidatePath('/', 'layout');
  redirect(`/practice/${sessionId}/summary`);
}

/** Abandon without a handoff is not offered — ending always produces one. */
export async function endOpenSession() {
  const s = openSession();
  if (!s) return;
  await endSession(s.id);
}

/* ------------------------------------------------------------------ *
 * The §8 challenges (Phase 4)
 * ------------------------------------------------------------------ */

/**
 * Open a boss fight for a topic.
 *
 * Not idempotent the way `beginSession` is, and it must not be: §8 gives the
 * boss fight no retries, so a second click while one is open has to be refused
 * rather than quietly resuming. `startBoss` throws `ChallengeUnavailable` and
 * the caller shows the reason.
 */
export async function beginBossFight(topicId: string) {
  const id = startBoss(topicId);
  revalidatePath('/', 'layout');
  redirect(`/challenge/${id}`);
}

/** §8 item 3, "The Gauntlet Run" — `sprint` in the code. */
export async function beginGauntletRun() {
  const id = startSprint();
  revalidatePath('/', 'layout');
  redirect(`/challenge/${id}`);
}

/**
 * Walk away from a run.
 *
 * For a boss fight this is a loss, and the action says so where it is used —
 * §8 gives it no retries, so a free exit would make the gate optional.
 */
export async function abandonRun(sessionId: number) {
  abandonChallenge(sessionId);
  revalidatePath('/', 'layout');
  redirect(`/challenge/${sessionId}`);
}

/* ------------------------------------------------------------------ *
 * Transcripts (Phase 3, SPEC §6)
 * ------------------------------------------------------------------ */

/** Who is speaking, so the learner's turns can be told from the teacher's. */
export async function previewTranscript(raw: string) {
  return preview(raw);
}

/**
 * Store a transcript and its proposed findings.
 *
 * Nothing reaches the error log here. CLAUDE.md: "Never auto-apply a transcript
 * finding. Findings are proposed; the user confirms."
 */
export async function uploadTranscript(input: {
  raw: string;
  learner: string | null;
  source: 'lorena' | 'self_recording' | 'other';
  classDate: string;
  title?: string;
}) {
  const result = ingest(input);
  revalidatePath('/', 'layout');
  redirect(`/transcripts/${result.transcriptId}`);
}

/** Accept / One-off / Reject one finding. The only path that writes state. */
export async function decideFinding(findingId: number, decision: Decision) {
  decide(findingId, decision);
  revalidatePath('/', 'layout');
}

export async function finishReview(transcriptId: number) {
  closeReview(transcriptId);
  revalidatePath('/', 'layout');
}

/* ------------------------------------------------------------------ *
 * Vocabulary (SRS)
 * ------------------------------------------------------------------ */

/** Grade one vocabulary card and reschedule it. */
export async function reviewVocabCard(vocabId: number, recall: Recall) {
  const result = reviewCard(vocabId, recall, openSession()?.id ?? null);
  revalidatePath('/', 'layout');
  return result;
}

/**
 * Pull the text out of an uploaded PDF.
 *
 * Takes base64 because a server action cannot receive a File directly. Class
 * transcripts are a few hundred KB, so the ~33% encoding overhead is not worth
 * a separate upload route.
 */
export async function extractPdf(base64: string): Promise<{
  text: string;
  pages: number;
  looksScanned: boolean;
}> {
  const { extractPdfText } = await import('@/lib/pdf');
  return extractPdfText(new Uint8Array(Buffer.from(base64, 'base64')));
}
