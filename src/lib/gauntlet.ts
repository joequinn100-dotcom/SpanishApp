import 'server-only';
import type { DB } from '@/db';
import { tx } from '@/db';
import type {
  GauntletOutcome,
  GenerationRequest,
} from '@/domain/gauntlet';

/**
 * Persistence for the gauntlet loop (SPEC §5).
 *
 * The loop itself is pure and lives in `@/domain/gauntlet`. This is the half
 * that touches SQLite, and it exists to enforce one invariant that the pure
 * layer cannot: **quarantined content and live content go to different tables,
 * and nothing reads the quarantine table into a session.**
 *
 * §5 says a quarantined batch is "never shown to the user, surfaced in an admin
 * view". Writing it to `content` with a flag would leave that one forgotten
 * `WHERE` clause away from being served. A separate table makes the mistake
 * impossible to make by omission — the only way to show quarantined content is
 * to deliberately query for it.
 */

/** A batch write is one transaction: either the whole batch lands or none of it. */
export function persistOutcome(
  db: DB,
  request: GenerationRequest,
  outcome: GauntletOutcome,
): { accepted: number; quarantined: number } {
  return tx(db, () => {
    if (outcome.outcome === 'quarantined') {
      const insert = db.prepare(`
        INSERT INTO quarantine (topic_id, kind, payload, gauntlet_log, rounds_used,
                                final_score, reason, quarantined_at)
        VALUES (@topicId, @kind, @payload, @log, @rounds, @score, @reason, @at)
      `);
      const log = JSON.stringify({ request, rounds: outcome.rounds });
      for (const item of outcome.items) {
        insert.run({
          topicId: request.topicId,
          kind: item.kind,
          payload: JSON.stringify(item.payload),
          log,
          rounds: outcome.rounds.length,
          score: outcome.score,
          reason: outcome.reason ?? 'failed the gauntlet',
          at: outcome.verifiedAt,
        });
      }
      return { accepted: 0, quarantined: outcome.items.length };
    }

    const insert = db.prepare(`
      INSERT INTO content (topic_id, kind, difficulty, payload, targets_error,
                           gauntlet_score, gauntlet_log, verified_at, retired,
                           provenance, seed_key)
      VALUES (@topicId, @kind, @difficulty, @payload, @targetsError,
              @score, @log, @verifiedAt, 0, 'gauntlet', NULL)
    `);
    // The log is the audit trail §5 requires: every round, every verifier, not
    // just the verdict that happened to win.
    const log = JSON.stringify({
      request,
      score: outcome.score,
      verdict: 'accepted',
      roundsUsed: outcome.rounds.length,
      rounds: outcome.rounds,
    });
    for (const item of outcome.items) {
      insert.run({
        topicId: request.topicId,
        kind: item.kind,
        difficulty: item.difficulty,
        payload: JSON.stringify(item.payload),
        targetsError: request.targetsError ?? null,
        score: outcome.score,
        log,
        verifiedAt: outcome.verifiedAt,
      });
    }
    return { accepted: outcome.items.length, quarantined: 0 };
  });
}

/* ------------------------------------------------------------------ *
 * The content pool
 * ------------------------------------------------------------------ */

/**
 * §5 cost control: "Pre-generate overnight. A background job fills the content
 * pool for the next 3 recommended topics while you sleep. Sessions should never
 * wait on generation."
 *
 * This is the number that job reads to decide whether a topic needs filling.
 * Retired rows do not count — they are the reason the pool is being refilled.
 */
export function poolSize(db: DB, topicId: string): number {
  const row = db
    .prepare('SELECT COUNT(*) AS n FROM content WHERE topic_id = ? AND retired = 0')
    .get(topicId) as { n: number };
  return row.n;
}

/** Topics whose live pool has fallen below `target`, neediest first. */
export function topicsNeedingContent(
  db: DB,
  topicIds: string[],
  target: number,
): { topicId: string; have: number; need: number }[] {
  return topicIds
    .map((topicId) => {
      const have = poolSize(db, topicId);
      return { topicId, have, need: target - have };
    })
    .filter((t) => t.need > 0)
    .sort((a, b) => b.need - a.need);
}

/**
 * §5: "Only regenerate when a drill is retired for over-familiarity (seen 6+
 * times with 100% accuracy)."
 *
 * Both halves matter. Seen six times is not enough on its own — an item the
 * learner keeps getting wrong is the *last* one to retire, and retiring it
 * would remove the evidence the error log needs. And 100% accuracy on two
 * attempts says nothing yet.
 *
 * Accent-only answers count as correct here, deliberately. `attempt.correct` is
 * already 1 for them (partial 0.8), and an item whose only remaining difficulty
 * is a written accent has stopped teaching the structure it was built for.
 */
export const FAMILIARITY_ATTEMPTS = 6;

export function retireOverFamiliar(db: DB): number {
  const rows = db
    .prepare(
      `SELECT c.id AS id
         FROM content c
         JOIN attempt a ON a.content_id = c.id
        WHERE c.retired = 0
        GROUP BY c.id
       HAVING COUNT(*) >= ?
          AND SUM(CASE WHEN a.correct = 1 THEN 0 ELSE 1 END) = 0`,
    )
    .all(FAMILIARITY_ATTEMPTS) as { id: number }[];

  if (rows.length === 0) return 0;
  const retire = db.prepare('UPDATE content SET retired = 1 WHERE id = ?');
  tx(db, () => {
    for (const r of rows) retire.run(r.id);
  });
  return rows.length;
}

/* ------------------------------------------------------------------ *
 * Admin view
 * ------------------------------------------------------------------ */

export interface QuarantineRow {
  id: number;
  topicId: string | null;
  kind: string;
  payload: string;
  roundsUsed: number;
  finalScore: number | null;
  reason: string;
  quarantinedAt: string;
}

/**
 * §5: quarantined content is "surfaced in an admin view so a systematic
 * generator fault is visible rather than silently discarded". This is the only
 * function in the codebase that reads that table, and nothing in the session
 * path calls it.
 */
export function listQuarantined(db: DB, limit = 100): QuarantineRow[] {
  return db
    .prepare(
      `SELECT id, topic_id AS topicId, kind, payload, rounds_used AS roundsUsed,
              final_score AS finalScore, reason, quarantined_at AS quarantinedAt
         FROM quarantine
        ORDER BY quarantined_at DESC, id DESC
        LIMIT ?`,
    )
    .all(limit) as QuarantineRow[];
}

/** How often the panel is failing, by reason. A spike here is a generator fault. */
export function quarantineSummary(db: DB): { reason: string; n: number }[] {
  return db
    .prepare(
      `SELECT reason, COUNT(*) AS n
         FROM quarantine
        GROUP BY reason
        ORDER BY n DESC`,
    )
    .all() as { reason: string; n: number }[];
}
