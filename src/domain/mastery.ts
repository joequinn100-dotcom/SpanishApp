/**
 * The mastery state machines (SPEC §4).
 *
 * Pure functions over plain records — no database, no clock, no I/O. Every
 * transition in §4 is expressible as one call, which is what lets the tests
 * assert the grading logic directly instead of through a query.
 *
 * The governing principle, from §4: "Getting it right in a drill immediately
 * after being taught it proves nothing." Both machines are built so that
 * promotion requires evidence spread over time, and a single fresh mistake
 * costs more than a single fresh success gains.
 */

export type TopicStatus = 'locked' | 'available' | 'studying' | 'consolidating' | 'mastered';
export type ErrorStatus = 'active' | 'improving' | 'consolidating' | 'resolved' | 'regressed';

/* ------------------------------------------------------------------ *
 * Constants — every threshold §4 names, in one place
 * ------------------------------------------------------------------ */

export const TOPIC = {
  /** studying → consolidating */
  MIN_ATTEMPTS: 12,
  MIN_ACCURACY: 0.8,
  /** consolidating → mastered */
  REVIEW_OFFSETS_DAYS: [3, 10] as const,
  REQUIRED_REVIEWS: 2,
  REQUIRED_SPONTANEOUS: 1,
} as const;

export const ERR = {
  /** active|regressed → improving */
  IMPROVING_STREAK: 5,
  /** improving → consolidating */
  CONSOLIDATING_STREAK: 12,
  CONSOLIDATING_SPONTANEOUS: 2,
  /** consolidating → resolved */
  RESOLVED_SILENT_DAYS: 21,
} as const;

/** §4's warm-up table. `regressed` outranks `active`: a broken promise is worse
 *  than a known-open problem. */
export const STATUS_MULTIPLIER: Record<ErrorStatus, number> = {
  active: 1.0,
  regressed: 1.4,
  improving: 0.6,
  consolidating: 0.3,
  resolved: 0,
};

/* ------------------------------------------------------------------ *
 * Time helpers
 * ------------------------------------------------------------------ */

const DAY_MS = 86_400_000;

export function daysBetween(from: string, to: string): number {
  return (new Date(to).getTime() - new Date(from).getTime()) / DAY_MS;
}

export function addDays(iso: string, days: number): string {
  return new Date(new Date(iso).getTime() + days * DAY_MS).toISOString();
}

/* ------------------------------------------------------------------ *
 * Topics
 * ------------------------------------------------------------------ */

export interface TopicState {
  status: TopicStatus;
  /** Rolling over the last 20 attempts — NOT correct/attempts. Supplied by the
   *  caller from the attempt table so this module stays pure. */
  accuracy: number;
  attempts: number;
  correct: number;
  spontaneous: number;
  firstSeen: string | null;
  lastSeen: string | null;
  masteredAt: string | null;
  consolidatingSince: string | null;
  reviewsPassed: number;
  nextReviewAt: string | null;
}

export type TopicEvent =
  | { type: 'prereqs_satisfied' }
  | { type: 'attempt'; correct: boolean; rollingAccuracy: number }
  | { type: 'spontaneous_use' }
  | { type: 'review'; passed: boolean }
  | { type: 'transcript_error' };

export function newTopicState(status: TopicStatus = 'locked'): TopicState {
  return {
    status,
    accuracy: 0,
    attempts: 0,
    correct: 0,
    spontaneous: 0,
    firstSeen: null,
    lastSeen: null,
    masteredAt: null,
    consolidatingSince: null,
    reviewsPassed: 0,
    nextReviewAt: null,
  };
}

/** Drop a topic back to `studying` and clear its consolidation progress. */
function regressTopic(s: TopicState): TopicState {
  return {
    ...s,
    status: 'studying',
    masteredAt: null,
    consolidatingSince: null,
    reviewsPassed: 0,
    nextReviewAt: null,
  };
}

/** consolidating → mastered, when both halves of §4's gate are satisfied. */
function checkTopicMastery(s: TopicState, now: string): TopicState {
  if (s.status !== 'consolidating') return s;
  if (s.reviewsPassed < TOPIC.REQUIRED_REVIEWS) return s;
  if (s.spontaneous < TOPIC.REQUIRED_SPONTANEOUS) return s;
  return { ...s, status: 'mastered', masteredAt: now, nextReviewAt: null };
}

export function topicTransition(state: TopicState, event: TopicEvent, now: string): TopicState {
  switch (event.type) {
    case 'prereqs_satisfied':
      // Only unlocks. Never demotes a topic already in progress.
      return state.status === 'locked' ? { ...state, status: 'available' } : state;

    case 'attempt': {
      let s: TopicState = {
        ...state,
        attempts: state.attempts + 1,
        correct: state.correct + (event.correct ? 1 : 0),
        accuracy: event.rollingAccuracy,
        firstSeen: state.firstSeen ?? now,
        lastSeen: now,
      };

      // A mastered topic that fails is not mastered. §4 makes this unconditional.
      if (state.status === 'mastered' && !event.correct) return regressTopic(s);

      // First attempt logged is what moves available → studying.
      if (s.status === 'available') s = { ...s, status: 'studying' };

      if (
        s.status === 'studying' &&
        s.accuracy >= TOPIC.MIN_ACCURACY &&
        s.attempts >= TOPIC.MIN_ATTEMPTS
      ) {
        s = {
          ...s,
          status: 'consolidating',
          consolidatingSince: now,
          reviewsPassed: 0,
          nextReviewAt: addDays(now, TOPIC.REVIEW_OFFSETS_DAYS[0]),
        };
      }
      return s;
    }

    case 'spontaneous_use':
      return checkTopicMastery({ ...state, spontaneous: state.spontaneous + 1 }, now);

    case 'review': {
      if (state.status !== 'consolidating') return state;
      if (!event.passed) {
        // "2 clean spaced reviews" — a failed review is not clean, so the
        // sequence restarts rather than merely pausing. (Interpretation: §4
        // specifies the gate but not the failure path.)
        return {
          ...state,
          reviewsPassed: 0,
          nextReviewAt: addDays(now, TOPIC.REVIEW_OFFSETS_DAYS[0]),
        };
      }
      const passed = state.reviewsPassed + 1;
      const nextOffset = TOPIC.REVIEW_OFFSETS_DAYS[passed];
      const s: TopicState = {
        ...state,
        reviewsPassed: passed,
        nextReviewAt: nextOffset === undefined ? null : addDays(now, nextOffset),
      };
      return checkTopicMastery(s, now);
    }

    case 'transcript_error':
      if (state.status === 'mastered') return regressTopic(state);
      // Same "clean" reasoning as a failed review: an error in the wild during
      // the consolidation window restarts the sequence.
      if (state.status === 'consolidating') {
        return {
          ...state,
          reviewsPassed: 0,
          nextReviewAt: addDays(now, TOPIC.REVIEW_OFFSETS_DAYS[0]),
        };
      }
      return state;
  }
}

/* ------------------------------------------------------------------ *
 * Errors
 * ------------------------------------------------------------------ */

export interface ErrorState {
  status: ErrorStatus;
  severity: number;
  occurrences: number;
  cleanStreak: number;
  spontaneousOk: number;
  lastOccurred: string | null;
  consolidatingSince: string | null;
  resolvedAt: string | null;
}

export type ErrorEvent =
  /** the user committed the error */
  | { type: 'committed' }
  /** a correct production in a drill or freewrite */
  | { type: 'avoided' }
  /** a correct, unprompted use found in a transcript — the evidence §4 requires */
  | { type: 'spontaneous_ok' }
  /** time passing; the only thing that can close the 21-day silent window */
  | { type: 'tick' };

export function newErrorState(severity: number, status: ErrorStatus = 'active'): ErrorState {
  return {
    status,
    severity,
    occurrences: 0,
    cleanStreak: 0,
    spontaneousOk: 0,
    lastOccurred: null,
    consolidatingSince: null,
    resolvedAt: null,
  };
}

/** Promotion ladder, applied after any clean production. */
function promoteError(s: ErrorState, now: string): ErrorState {
  if (s.status === 'active' || s.status === 'regressed') {
    if (s.cleanStreak >= ERR.IMPROVING_STREAK) return { ...s, status: 'improving' };
    return s;
  }
  if (s.status === 'improving') {
    if (
      s.cleanStreak >= ERR.CONSOLIDATING_STREAK &&
      s.spontaneousOk >= ERR.CONSOLIDATING_SPONTANEOUS
    ) {
      return { ...s, status: 'consolidating', consolidatingSince: now };
    }
    return s;
  }
  return s;
}

export function errorTransition(state: ErrorState, event: ErrorEvent, now: string): ErrorState {
  switch (event.type) {
    case 'committed': {
      // A resolved error that recurs becomes `regressed` and stays there —
      // drilled at 1.4× until it re-earns `improving`. `improving` and
      // `consolidating` fall back to `active`, because the streak reset below
      // invalidates the evidence that promoted them.
      const status: ErrorStatus =
        state.status === 'resolved' || state.status === 'regressed' ? 'regressed' : 'active';
      return {
        ...state,
        status,
        occurrences: state.occurrences + 1,
        cleanStreak: 0,
        lastOccurred: now,
        consolidatingSince: null,
        resolvedAt: null,
      };
    }

    case 'avoided':
      return promoteError({ ...state, cleanStreak: state.cleanStreak + 1 }, now);

    case 'spontaneous_ok':
      // A correct unprompted use is also a clean production, so it advances
      // both counters — it is the strongest single piece of evidence available.
      return promoteError(
        {
          ...state,
          cleanStreak: state.cleanStreak + 1,
          spontaneousOk: state.spontaneousOk + 1,
        },
        now,
      );

    case 'tick': {
      if (state.status !== 'consolidating' || !state.consolidatingSince) return state;
      if (daysBetween(state.consolidatingSince, now) < ERR.RESOLVED_SILENT_DAYS) return state;
      return { ...state, status: 'resolved', resolvedAt: now };
    }
  }
}

/* ------------------------------------------------------------------ *
 * Warm-up selection (SPEC §4)
 * ------------------------------------------------------------------ */

export function recencyDecay(lastOccurred: string | null, now: string): number {
  // Never committed in this app's history — treat as coldest rather than
  // hottest, so seeded-but-unseen errors don't crowd out live ones.
  if (!lastOccurred) return 0.15;
  const d = daysBetween(lastOccurred, now);
  if (d < 7) return 1.0;
  if (d < 21) return 0.7;
  if (d < 60) return 0.4;
  return 0.15;
}

/**
 * weight = severity × log(1 + occurrences) × recency_decay × status_multiplier
 *
 * Note the shape of the first factor: an error with zero recorded occurrences
 * weighs exactly 0 and will never be selected. That is the spec's formula, not
 * an oversight on the caller's part — seed data therefore carries real
 * occurrence counts.
 */
export function warmupWeight(e: ErrorState, now: string): number {
  return (
    e.severity *
    Math.log(1 + e.occurrences) *
    recencyDecay(e.lastOccurred, now) *
    STATUS_MULTIPLIER[e.status]
  );
}

export interface WeightedError<T> {
  item: T;
  state: ErrorState;
  weight: number;
}

/**
 * Choose the session's warm-up set.
 *
 * §4: "Guarantee at least 2 items from the top-3 highest-severity active
 * errors every single session, regardless of the topic being studied." That
 * guarantee is why this isn't just a sort — the highest-severity errors are
 * often not the highest-weighted ones, because weight rewards frequency and
 * recency, and the worst errors are sometimes rare.
 */
export function selectWarmup<T>(
  errors: { item: T; state: ErrorState }[],
  count: number,
  now: string,
): WeightedError<T>[] {
  const weighted: WeightedError<T>[] = errors.map((e) => ({
    ...e,
    weight: warmupWeight(e.state, now),
  }));

  const topSeverityActive = weighted
    .filter((w) => w.state.status === 'active')
    .sort((a, b) => b.state.severity - a.state.severity || b.weight - a.weight)
    .slice(0, 3);

  const guaranteed = topSeverityActive.slice(0, Math.min(2, count));
  const taken = new Set(guaranteed);

  const rest = weighted
    .filter((w) => !taken.has(w) && w.weight > 0)
    .sort((a, b) => b.weight - a.weight);

  return [...guaranteed, ...rest].slice(0, count);
}
