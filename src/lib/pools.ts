import 'server-only';
import { db } from './queries';
import type { ContentRef } from '@/domain/session';
import type { ErrorState, ErrorStatus } from '@/domain/mastery';

/**
 * The three pools every planner draws from: a topic's drills, the drills that
 * target each error, and the live error list with the state §4's weight
 * formula reads.
 *
 * They live here rather than in `practice.ts` because sessions are no longer
 * the only thing that plans a queue — the boss fight and the Gauntlet Run
 * (SPEC §8) plan one too, and a second copy of these queries is a second place
 * for `retired = 0` to be forgotten.
 */

/**
 * A topic's own drills.
 *
 * Error-targeted items are excluded: they belong to the warm-up, which is
 * chosen by §4's weighting rather than by topic, and letting them count as
 * topic material would let a topic look well-stocked on the strength of drills
 * written about something else.
 */
export function contentForTopic(topicId: string): ContentRef[] {
  return (
    db()
      .prepare(
        `SELECT id, topic_id AS topicId, kind, difficulty, targets_error AS targetsError
           FROM content WHERE topic_id = ? AND retired = 0`,
      )
      .all(topicId) as ContentRef[]
  ).filter((c) => c.targetsError === null);
}

/** Every non-retired drill that targets an error, grouped by error code. */
export function contentByError(): Map<string, ContentRef[]> {
  const rows = db()
    .prepare(
      `SELECT id, topic_id AS topicId, kind, difficulty, targets_error AS targetsError
         FROM content WHERE targets_error IS NOT NULL AND retired = 0`,
    )
    .all() as ContentRef[];
  const map = new Map<string, ContentRef[]>();
  for (const r of rows) {
    const list = map.get(r.targetsError!) ?? [];
    list.push(r);
    map.set(r.targetsError!, list);
  }
  return map;
}

/** Every error that is not `resolved`, with its full state. */
export function liveErrors(): { code: string; state: ErrorState }[] {
  const rows = db()
    .prepare(
      `SELECT code, status, severity, occurrences, clean_streak, spontaneous_ok,
              last_occurred, consolidating_since, resolved_at
         FROM error WHERE status <> 'resolved'`,
    )
    .all() as {
    code: string;
    status: ErrorStatus;
    severity: number;
    occurrences: number;
    clean_streak: number;
    spontaneous_ok: number;
    last_occurred: string | null;
    consolidating_since: string | null;
    resolved_at: string | null;
  }[];

  return rows.map((r) => ({
    code: r.code,
    state: {
      status: r.status,
      severity: r.severity,
      occurrences: r.occurrences,
      cleanStreak: r.clean_streak,
      spontaneousOk: r.spontaneous_ok,
      lastOccurred: r.last_occurred,
      consolidatingSince: r.consolidating_since,
      resolvedAt: r.resolved_at,
    },
  }));
}
