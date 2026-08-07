import 'server-only';
import { db } from './queries';
import type { TopicState, TopicStatus } from '@/domain/mastery';

/**
 * Reading and writing one topic's mastery state.
 *
 * Every column of `TopicState` in one place, because the alternative — a
 * hand-written SELECT and UPDATE at each call site — is what let migration
 * 007's new `boss_cleared_at` be silently dropped on write at two of them.
 * A field added to the state machine now has exactly one place to be plumbed.
 */

interface Row {
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
  boss_cleared_at: string | null;
}

const COLUMNS = `status, accuracy, attempts, correct, spontaneous, first_seen, last_seen,
                 mastered_at, consolidating_since, reviews_passed, next_review_at, boss_cleared_at`;

export function readTopicState(topicId: string): TopicState | undefined {
  const row = db()
    .prepare(`SELECT ${COLUMNS} FROM topic_state WHERE topic_id = ?`)
    .get(topicId) as Row | undefined;
  if (!row) return undefined;

  return {
    status: row.status,
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
    bossClearedAt: row.boss_cleared_at,
  };
}

/** Writes every field. Callers pass the state the machine returned, whole. */
export function writeTopicState(topicId: string, s: TopicState): void {
  db()
    .prepare(
      `UPDATE topic_state
          SET status = ?, accuracy = ?, attempts = ?, correct = ?, spontaneous = ?,
              first_seen = ?, last_seen = ?, mastered_at = ?, consolidating_since = ?,
              reviews_passed = ?, next_review_at = ?, boss_cleared_at = ?
        WHERE topic_id = ?`,
    )
    .run(
      s.status,
      s.accuracy,
      s.attempts,
      s.correct,
      s.spontaneous,
      s.firstSeen,
      s.lastSeen,
      s.masteredAt,
      s.consolidatingSince,
      s.reviewsPassed,
      s.nextReviewAt,
      s.bossClearedAt,
      topicId,
    );
}
