'use server';

import { revalidatePath } from 'next/cache';
import { tx } from '@/db';
import { db } from '@/lib/queries';
import { recomputeAvailability } from '@/seed';
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
