import 'server-only';
import { db } from './queries';

/**
 * The streak (SPEC §8 item 1).
 *
 * Its own module because sessions are no longer the only thing that counts as
 * having shown up: the boss fight and the Gauntlet Run do too, and neither can
 * import `practice.ts` without a cycle.
 */

export function dayOf(iso: string): string {
  return iso.slice(0, 10);
}

/** §8: two freezes a month, so travel and a bad week do not break the streak. */
export const FREEZES_PER_MONTH = 2;

/**
 * Record activity for today, spending a freeze to bridge a missed day if one
 * is available.
 *
 * §8 is emphatic that "a broken streak is where these apps lose users", and
 * the freeze is the mechanism. It is spent silently for gaps of one or two
 * days: a freeze the learner has to remember to activate is a freeze that
 * never gets used on the day it was needed.
 */
export function touchStreak(now: string): void {
  const database = db();
  database
    .prepare(
      'INSERT OR IGNORE INTO streak (id, current, longest, freezes, freezes_reset_at) VALUES (1, 0, 0, ?, ?)',
    )
    .run(FREEZES_PER_MONTH, now);

  const s = database.prepare('SELECT * FROM streak WHERE id = 1').get() as {
    current: number;
    longest: number;
    last_active: string | null;
    freezes: number;
    freezes_reset_at: string | null;
  };

  const today = dayOf(now);
  if (s.last_active && dayOf(s.last_active) === today) return;

  // Freezes replenish on a calendar month boundary.
  let freezes = s.freezes;
  let resetAt = s.freezes_reset_at;
  if (!resetAt || resetAt.slice(0, 7) !== now.slice(0, 7)) {
    freezes = FREEZES_PER_MONTH;
    resetAt = now;
  }

  let current = 1;
  let spent = 0;
  if (s.last_active) {
    const gap = Math.round(
      (new Date(today).getTime() - new Date(dayOf(s.last_active)).getTime()) / 86_400_000,
    );
    if (gap === 1) {
      current = s.current + 1;
    } else if (gap > 1) {
      // One freeze per missed day. Bridge only if every gap day can be paid for.
      const missed = gap - 1;
      if (missed <= freezes) {
        spent = missed;
        current = s.current + 1;
      }
    }
  }

  database
    .prepare(
      `UPDATE streak
          SET current = ?, longest = max(longest, ?), last_active = ?,
              freezes = ?, freezes_reset_at = ?
        WHERE id = 1`,
    )
    .run(current, current, now, freezes - spent, resetAt);
}

export function streak(): {
  current: number;
  longest: number;
  freezes: number;
  lastActive: string | null;
} {
  const row = db()
    .prepare('SELECT current, longest, freezes, last_active FROM streak WHERE id = 1')
    .get() as
    | { current: number; longest: number; freezes: number; last_active: string | null }
    | undefined;
  return row
    ? { current: row.current, longest: row.longest, freezes: row.freezes, lastActive: row.last_active }
    : { current: 0, longest: 0, freezes: FREEZES_PER_MONTH, lastActive: null };
}

