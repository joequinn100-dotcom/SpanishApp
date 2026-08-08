/**
 * Spaced repetition for vocabulary (SPEC §2's `vocab` table).
 *
 * SM-2, with one deliberate departure that comes from §4 rather than from the
 * algorithm: the top stage is not reachable by answering cards. SM-2 schedules
 * recall; it cannot tell you whether a word has entered your active speech. §4
 * settles that question the same way it settles everything else — spontaneous
 * evidence, found in a transcript, never in a prompt.
 *
 * Pure functions over plain records: no database, no clock.
 */

export type VocabStage = 'new' | 'recognizing' | 'using' | 'spontaneous';

/** What the learner said about the card, in the three grades a person can judge. */
export type Recall =
  /** Did not know it. */
  | 'again'
  /** Got there, with effort. */
  | 'good'
  /** Instant. */
  | 'easy';

export interface VocabState {
  stage: VocabStage;
  /** SM-2 easiness factor. Never below 1.3, or intervals collapse to nothing. */
  ease: number;
  intervalDays: number;
  dueAt: string | null;
  /** Consecutive successful recalls. Reset by a lapse. */
  reps: number;
  /** Lifetime count of forgetting a word that was previously known. */
  lapses: number;
  lastReviewed: string | null;
}

export const SRS = {
  MIN_EASE: 1.3,
  START_EASE: 2.5,
  /** First two intervals are fixed in SM-2; after that the ease factor drives them. */
  FIRST_INTERVAL: 1,
  SECOND_INTERVAL: 6,
  /** A lapse does not go back to zero — the word is not new, it is leaky. */
  LAPSE_INTERVAL: 1,
  /** Reps needed before a word counts as being *used* rather than recognised. */
  USING_REPS: 3,
  /** Cap, so a well-known word does not vanish for a year before an exam. */
  MAX_INTERVAL_DAYS: 120,
} as const;

/** The grades, at runtime. Server actions cross the wire, where types do not. */
export const RECALL_VALUES: readonly Recall[] = ['again', 'good', 'easy'] as const;

const QUALITY: Record<Recall, number> = { again: 2, good: 4, easy: 5 };

const DAY_MS = 86_400_000;

export function newVocabState(): VocabState {
  return {
    stage: 'new',
    ease: SRS.START_EASE,
    intervalDays: 0,
    dueAt: null,
    reps: 0,
    lapses: 0,
    lastReviewed: null,
  };
}

function addDays(iso: string, days: number): string {
  return new Date(new Date(iso).getTime() + days * DAY_MS).toISOString();
}

/**
 * Advance a card after a review.
 *
 * Note what does *not* happen here: nothing ever sets `spontaneous`. That stage
 * is written only by an accepted positive transcript finding, because a card
 * you recall on demand is not a word you reach for unprompted, and conflating
 * the two would let the app claim a vocabulary you do not actually speak.
 */
export function reviewVocab(state: VocabState, recall: Recall, now: string): VocabState {
  const q = QUALITY[recall];

  // SM-2's ease update. A wrong answer costs ease; an easy one earns a little.
  const ease = Math.max(
    SRS.MIN_EASE,
    state.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
  );

  if (recall === 'again') {
    return {
      ...state,
      // A lapse on a card that was already known is worth counting: it is the
      // signal that the word was learned by the schedule rather than by use.
      lapses: state.lapses + (state.reps > 0 ? 1 : 0),
      reps: 0,
      ease,
      intervalDays: SRS.LAPSE_INTERVAL,
      dueAt: addDays(now, SRS.LAPSE_INTERVAL),
      lastReviewed: now,
      // Demote, but never below `recognizing` — the word has been met.
      stage: state.stage === 'new' ? 'new' : 'recognizing',
    };
  }

  const reps = state.reps + 1;
  const interval =
    reps === 1
      ? SRS.FIRST_INTERVAL
      : reps === 2
        ? SRS.SECOND_INTERVAL
        : Math.min(SRS.MAX_INTERVAL_DAYS, Math.round(state.intervalDays * ease));

  // `spontaneous` is never granted or revoked here — see the note above.
  const stage: VocabStage =
    state.stage === 'spontaneous'
      ? 'spontaneous'
      : reps >= SRS.USING_REPS
        ? 'using'
        : 'recognizing';

  return { ...state, stage, ease, reps, intervalDays: interval, dueAt: addDays(now, interval), lastReviewed: now };
}

/** An unprompted correct use found in a transcript — the only route to the top stage. */
export function markSpontaneous(state: VocabState): VocabState {
  return { ...state, stage: 'spontaneous' };
}

export function isDue(state: VocabState, now: string): boolean {
  if (state.dueAt === null) return true; // never reviewed
  return new Date(state.dueAt).getTime() <= new Date(now).getTime();
}

/**
 * Which direction to ask the card in.
 *
 * Recognition first, production once the word is known: asking for production
 * on first sight teaches nothing, and asking for recognition forever never
 * makes a word usable. The flip is what turns a glossary into vocabulary.
 */
export function promptDirection(stage: VocabStage): 'es_to_en' | 'en_to_es' {
  return stage === 'new' ? 'es_to_en' : 'en_to_es';
}

/**
 * Choose the day's cards.
 *
 * Due cards first, oldest debt first; then new words, capped, so a big backlog
 * of introductions never crowds out the reviews that keep existing words alive.
 */
export function selectVocab<T>(
  cards: { item: T; state: VocabState }[],
  count: number,
  now: string,
  newCap = 5,
): { item: T; state: VocabState }[] {
  const due = cards
    .filter((c) => c.state.stage !== 'new' && isDue(c.state, now))
    .sort((a, b) => (a.state.dueAt ?? '').localeCompare(b.state.dueAt ?? ''));

  const fresh = cards.filter((c) => c.state.stage === 'new').slice(0, newCap);

  return [...due, ...fresh].slice(0, count);
}
