/**
 * Drill grading (SPEC §9 Phase 2, "live grading").
 *
 * Pure functions over plain records — no database, no clock, no model call.
 * Grading a written Spanish answer is not string equality, and the ways it
 * differs are exactly the ways a learner's answer differs from a key:
 *
 *   - punctuation and case are noise (`¿Cuándo llegó?` === `cuando llego`? no —
 *     see accents below, but the `¿` and the capital are noise);
 *   - accents are signal, but a *different kind* of signal than a wrong verb
 *     form, and conflating them makes the mastery gates lie;
 *   - a wrong answer is often wrong in a known way, and naming that way is the
 *     entire pedagogical value of the item.
 *
 * The last point is why `distractors` exists. A drill that says "incorrect" has
 * taught nothing. A drill that says "you wrote the conditional where the
 * imperfect subjunctive belongs, and here is why that boundary exists" is the
 * app.
 */

/* ------------------------------------------------------------------ *
 * Content payloads
 * ------------------------------------------------------------------ */

export type DrillKind =
  | 'drill_conjugation'
  | 'drill_cloze'
  | 'drill_transform'
  | 'drill_translate'
  | 'drill_error_spot';

export const DRILL_KINDS: DrillKind[] = [
  'drill_conjugation',
  'drill_cloze',
  'drill_transform',
  'drill_translate',
  'drill_error_spot',
];

/** A known wrong answer and the explanation it earns. */
export interface Distractor {
  /** Matched after normalization, so write it in plain form. */
  answer: string;
  /** Why this is wrong — the rule, not just "no". */
  feedback: string;
  /** Logs an `error_event` with outcome `committed` when matched. */
  errorCode?: string;
}

export interface DrillPayload {
  /** The instruction, in English. The learner is an English speaker. */
  prompt: string;
  /** The work scenario the item sits in. SPEC §11: always construction/consulting. */
  context?: string;
  /** The sentence to complete, transform, translate or repair. */
  sentence: string;
  /** The canonical correct answer — just the target span, not the whole sentence. */
  answer: string;
  /** Equally correct alternatives. Graded as fully correct, no hedging. */
  accept?: string[];
  /** Known wrong answers with targeted feedback. */
  distractors?: Distractor[];
  /** Shown after answering, always. Thorough: rule, why, exceptions. */
  explanation: string;
  /** Optional nudge available before answering. Costs nothing but pride. */
  hint?: string;
}

/* ------------------------------------------------------------------ *
 * Normalization
 * ------------------------------------------------------------------ */

/**
 * `ñ` is a letter, not an accented `n`, and `ü` in *bilingüe* changes the
 * pronunciation rather than the stress. Stripping either would mark a real
 * error correct, so only the five stress-bearing vowels are folded.
 */
const ACCENT_FOLD: Record<string, string> = {
  á: 'a',
  é: 'e',
  í: 'i',
  ó: 'o',
  ú: 'u',
};

/** Lowercase, strip surrounding punctuation, collapse whitespace. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFC')
    .replace(/[¿¡"'“”‘’(),.;:!?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Normalized, with stress accents removed. Used only to detect accent-only misses. */
export function foldAccents(s: string): string {
  return normalize(s).replace(/[áéíóú]/g, (c) => ACCENT_FOLD[c]);
}

/* ------------------------------------------------------------------ *
 * Grading
 * ------------------------------------------------------------------ */

export type Verdict =
  /** Exact match against the key or an accepted alternative. */
  | 'correct'
  /** Right form, missing or misplaced written accent. */
  | 'accent'
  /** Matched a known wrong answer; feedback names the specific confusion. */
  | 'distractor'
  /** Wrong, and not in a way the item anticipated. */
  | 'incorrect'
  /** Nothing submitted. Never counted as an attempt. */
  | 'blank';

export interface Grade {
  verdict: Verdict;
  /**
   * Whether this counts toward `topic_state.correct` and rolling accuracy.
   *
   * INTERPRETATION (SPEC is silent): an accent-only miss counts as correct.
   * §4's gates measure whether the grammar is installed, and *preferiríamos*
   * spelled *prefeririamos* proves the tense choice was right. The miss is
   * still surfaced in feedback and scored at 0.8 partial, so it is visible
   * without being able to hold a topic below the 0.80 consolidation gate on
   * its own.
   */
  correct: boolean;
  /** 0..1. Written to `attempt.partial`. */
  partial: number;
  /** Shown to the learner. Never bare "incorrect". */
  feedback: string;
  /** The canonical answer, for the review line. */
  expected: string;
  /** Error codes this attempt provides evidence for. */
  errorsFound: string[];
}

/**
 * Grade one submitted answer.
 *
 * `targetsError` is the error code the item was chosen to probe (from
 * `content.targets_error`). Getting the item right is evidence the error was
 * *avoided*; getting it wrong is evidence it was *committed* — that is the link
 * between the drill runner and SPEC §4's error machine, and it is why warm-up
 * items are worth more than topic items.
 */
export function grade(
  payload: DrillPayload,
  submitted: string,
  targetsError?: string | null,
): Grade {
  const given = normalize(submitted ?? '');

  if (given === '') {
    return {
      verdict: 'blank',
      correct: false,
      partial: 0,
      feedback: 'No answer submitted.',
      expected: payload.answer,
      errorsFound: [],
    };
  }

  const keys = [payload.answer, ...(payload.accept ?? [])];

  if (keys.some((k) => normalize(k) === given)) {
    return {
      verdict: 'correct',
      correct: true,
      partial: 1,
      feedback: payload.explanation,
      expected: payload.answer,
      errorsFound: targetsError ? [targetsError] : [],
    };
  }

  // Distractors are checked before the accent fold, and the order matters. Some
  // wrong answers differ from the key only by an accent and are still hard
  // errors — «aprobo» for «aprobó» is not a spelling slip, it is not a word.
  // An item that anticipates an answer has said something about it that the
  // generic accent rule does not know.
  const hit = (payload.distractors ?? []).find((d) => normalize(d.answer) === given);
  if (!hit) {
    const key = keys.find((k) => foldAccents(k) === foldAccents(given));
    if (key) {
      return {
        verdict: 'accent',
        correct: true,
        partial: 0.8,
        feedback: `The form is right, the written accent is not — it is «${key}», not «${submitted.trim()}». ${accentNote(key)}\n\n${payload.explanation}`,
        expected: payload.answer,
        errorsFound: targetsError ? [targetsError] : [],
      };
    }
  }

  if (hit) {
    const codes = new Set<string>();
    if (hit.errorCode) codes.add(hit.errorCode);
    if (targetsError) codes.add(targetsError);
    return {
      verdict: 'distractor',
      correct: false,
      partial: 0,
      feedback: `${hit.feedback}\n\n${payload.explanation}`,
      expected: payload.answer,
      errorsFound: [...codes],
    };
  }

  return {
    verdict: 'incorrect',
    correct: false,
    partial: 0,
    feedback: `The answer is «${payload.answer}».\n\n${payload.explanation}`,
    expected: payload.answer,
    errorsFound: targetsError ? [targetsError] : [],
  };
}

/**
 * Why the accent is where it is. Spanish stress is rule-governed, so a learner
 * who knows the three rules never has to memorize an individual word.
 */
function accentNote(key: string): string {
  const word = key.split(' ').find((w) => /[áéíóú]/.test(w)) ?? key;
  if (/[aeiouáéíóúns]$/.test(word)) {
    return 'A word ending in a vowel, -n or -s is stressed on the second-to-last syllable by default, so the written accent on «' +
      word +
      '» is what moves the stress off that default.';
  }
  return 'A word ending in a consonant other than -n or -s is stressed on the last syllable by default, so the written accent on «' +
    word +
    '» is what moves the stress off that default.';
}

/**
 * Whether a graded attempt is evidence the targeted error was avoided or
 * committed. Returns null when the item does not target an error, so the
 * caller writes no `error_event` at all rather than a neutral one.
 */
export function errorOutcome(g: Grade): 'avoided' | 'committed' | null {
  if (g.verdict === 'blank') return null;
  // An accent slip is not the grammatical error the item was probing.
  return g.correct ? 'avoided' : 'committed';
}

/**
 * Rolling accuracy over the last N attempts (SPEC §2: "NOT correct/attempts").
 *
 * Takes most-recent-first partial scores. A learner who was 40% for a month and
 * is 90% this week should read as 90%, because the mastery gate is asking
 * "can you do this now", not "what is your career average".
 */
export const ROLLING_WINDOW = 20;

export function rollingAccuracy(recentPartials: number[], window = ROLLING_WINDOW): number {
  const slice = recentPartials.slice(0, window);
  if (slice.length === 0) return 0;
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}
