/**
 * The Timeline projection (SPEC §8).
 *
 * §8 calls one number "the single most motivating thing in the app": *at your
 * current pace you reach B2 threshold on 14 Nov — 17 days before your exam.*
 * Everything here exists to compute that honestly, which mostly means refusing
 * to compute it when the evidence will not carry it.
 *
 * Pure: no database, no clock. The caller supplies `now`.
 */

export type LevelId = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export const LEVEL_ORDER: LevelId[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;

export const VELOCITY_WINDOW_DAYS = 28;

/**
 * Topics mastered per week, over a trailing window.
 *
 * A window rather than a lifetime average, for the same reason §2 insists
 * accuracy is rolling: a burst of placement three weeks ago says nothing about
 * this week's pace, and a projection built on it would be a flattering lie.
 *
 * Placement is excluded by the caller — declaring you already knew A1 is not
 * evidence of how fast you learn.
 */
export function velocity(
  masteredAt: string[],
  now: string,
  windowDays = VELOCITY_WINDOW_DAYS,
): number {
  const cutoff = new Date(now).getTime() - windowDays * DAY_MS;
  const recent = masteredAt.filter((d) => new Date(d).getTime() >= cutoff);
  return (recent.length / windowDays) * 7;
}

export interface Projection {
  /** Topics still to master before the target level is cleared. */
  remaining: number;
  /** Topics per week, from the trailing window. */
  perWeek: number;
  /** ISO date the projection lands on, or null when it cannot be computed. */
  date: string | null;
  weeksNeeded: number | null;
  /** Positive = days to spare before the exam. Negative = days late. */
  daysBeforeExam: number | null;
  onTrack: boolean | null;
  /**
   * Why there is no date, when there isn't one. Shown verbatim: a projection
   * that quietly reads "—" teaches nothing, and a fabricated one is worse.
   */
  reason: string | null;
}

/**
 * When the remaining topics run out, at the current pace.
 *
 * Returns no date rather than a bad one in the two cases where a number would
 * be dishonest: nothing mastered recently (pace unknown, not zero), and a pace
 * so slow the projection lands past any horizon worth drawing.
 */
export function project(input: {
  remaining: number;
  masteredAt: string[];
  now: string;
  examDate: string;
  windowDays?: number;
}): Projection {
  const { remaining, masteredAt, now, examDate, windowDays = VELOCITY_WINDOW_DAYS } = input;
  const perWeek = velocity(masteredAt, now, windowDays);

  if (remaining <= 0) {
    return {
      remaining: 0,
      perWeek,
      date: now,
      weeksNeeded: 0,
      daysBeforeExam: Math.round((new Date(examDate).getTime() - new Date(now).getTime()) / DAY_MS),
      onTrack: true,
      reason: null,
    };
  }

  if (perWeek <= 0) {
    return {
      remaining,
      perWeek: 0,
      date: null,
      weeksNeeded: null,
      daysBeforeExam: null,
      onTrack: null,
      reason:
        'No topics mastered in the last four weeks, so there is no pace to project from. One session changes that.',
    };
  }

  const weeksNeeded = remaining / perWeek;
  const date = new Date(new Date(now).getTime() + weeksNeeded * WEEK_MS).toISOString();

  // Beyond a couple of years the arithmetic is technically fine and the answer
  // is meaningless. Say so instead of drawing a marker off the end of the track.
  if (weeksNeeded > 104) {
    return {
      remaining,
      perWeek,
      date: null,
      weeksNeeded,
      daysBeforeExam: null,
      onTrack: false,
      reason: `At ${perWeek.toFixed(1)} topics a week, the remaining ${remaining} would take over two years. The pace, not the plan, is what has to change.`,
    };
  }

  const daysBeforeExam = Math.round(
    (new Date(examDate).getTime() - new Date(date).getTime()) / DAY_MS,
  );

  return {
    remaining,
    perWeek,
    date,
    weeksNeeded,
    daysBeforeExam,
    onTrack: daysBeforeExam >= 0,
    reason: null,
  };
}

/**
 * How many topics a week would clear the target by exam day.
 *
 * The number to quote when the projection is behind: "you need 3.2 a week"
 * is actionable in a way that "you are 40 days late" is not.
 */
export function requiredPace(remaining: number, now: string, examDate: string): number | null {
  const weeks = (new Date(examDate).getTime() - new Date(now).getTime()) / WEEK_MS;
  if (weeks <= 0) return null;
  return remaining / weeks;
}

/**
 * Where the learner currently sits, as a CEFR band.
 *
 * A level is *reached* when its topics are essentially all mastered, and the
 * `+` suffix marks real progress into the next band. The threshold is 0.85
 * rather than 1.0 because a single unmastered topic in a level of twenty does
 * not make someone not-B1, and holding the marker back for it would make the
 * one number §8 cares about move in jerks.
 */
export function levelEstimate(
  byLevel: { level: LevelId; total: number; mastered: number }[],
): { band: LevelId; plus: boolean; fraction: number } {
  const at = (l: LevelId) => byLevel.find((b) => b.level === l);
  const ratio = (l: LevelId) => {
    const b = at(l);
    return b && b.total > 0 ? b.mastered / b.total : 0;
  };

  let band: LevelId = 'A1';
  for (const l of LEVEL_ORDER) {
    if (ratio(l) >= 0.85) band = l;
    else break;
  }

  const next = LEVEL_ORDER[LEVEL_ORDER.indexOf(band) + 1];
  const into = next ? ratio(next) : 0;
  const total = byLevel.reduce((n, b) => n + b.total, 0);
  const mastered = byLevel.reduce((n, b) => n + b.mastered, 0);

  return { band, plus: into >= 0.25 && into < 0.85, fraction: total ? mastered / total : 0 };
}

/**
 * Where a marker sits along the track, 0..1.
 *
 * Clamped at both ends so an overdue projection still renders on the track
 * rather than off the side of the screen.
 */
export function positionOn(date: string, start: string, end: string): number {
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  const t = new Date(date).getTime();
  if (b <= a) return 1;
  return Math.max(0, Math.min(1, (t - a) / (b - a)));
}

export interface ErrorMarker {
  code: string;
  label: string;
  severity: number;
  status: string;
  /** Set when resolved — the date it fell off the timeline. */
  resolvedAt: string | null;
  /** 0..1 toward resolution, for the ones still live. */
  progress: number;
}

/**
 * §8: "Error markers that visibly fall off the timeline as they resolve."
 *
 * Progress toward resolution is a composite, because §4's gate is: a clean
 * streak, then spontaneous evidence, then 21 silent days. Weighting them
 * equally would let a long streak alone imply near-resolution, which is exactly
 * the false comfort §4 is written to prevent — so the streak is capped at half.
 */
export function errorProgress(e: {
  status: string;
  cleanStreak: number;
  spontaneousOk: number;
  consolidatingSince: string | null;
  now: string;
}): number {
  if (e.status === 'resolved') return 1;
  const streak = Math.min(e.cleanStreak / 12, 1) * 0.5;
  const spont = Math.min(e.spontaneousOk / 2, 1) * 0.25;
  const silent =
    e.status === 'consolidating' && e.consolidatingSince
      ? Math.min(
          (new Date(e.now).getTime() - new Date(e.consolidatingSince).getTime()) /
            (21 * DAY_MS),
          1,
        ) * 0.25
      : 0;
  return Math.min(streak + spont + silent, 0.99);
}

/**
 * Push overlapping markers apart along the track.
 *
 * At four topics a week, twelve nodes all land inside three weeks and collapse
 * into an unreadable smear at the left edge. Nudging each one to sit at least
 * `min` from its predecessor keeps the order and the rough dates truthful while
 * making the row legible — the position is an estimate to a week's precision
 * either way, so a small nudge costs nothing real.
 *
 * Input must be sorted ascending; output stays within 0..1.
 */
export function spread(positions: number[], min = 0.05): number[] {
  const out: number[] = [];
  let prev = -Infinity;
  for (const p of positions) {
    const at = Math.min(1, Math.max(p, prev + min));
    out.push(at);
    prev = at;
  }
  return out;
}
