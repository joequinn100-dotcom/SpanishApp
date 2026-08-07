/**
 * The two timed challenges of SPEC §8 — the boss fight (item 4) and the
 * Gauntlet Run (item 3).
 *
 * Pure: no database, no clock, no randomness. The caller supplies `now` and a
 * picker, same contract as `session.ts`, so "does a boss fight only ever draw
 * from the topic it claims to test" is a test rather than a hope.
 *
 * They share a shape — a plan fixed at the start, a cursor, a running score —
 * and differ in what ends them. The boss runs all twelve items and is judged at
 * the end; the Gauntlet Run can end early, on the third life lost. That is the
 * whole difference, and it is why the outcome functions are separate rather
 * than one function with a flag.
 *
 * A note on the name: §5's verification panel is also called the gauntlet. The
 * user-facing label for §8 item 3 stays "Gauntlet Run", but everything in the
 * code and the schema calls it a *sprint*, so that `runGauntlet` and a
 * ten-item speed drill can never be confused at a call site.
 */

import { TOPIC, selectWarmup, type ErrorState } from './mastery';
import type { ContentRef } from './session';

/* ------------------------------------------------------------------ *
 * Shared
 * ------------------------------------------------------------------ */

/** Deterministic default: walk the list rather than repeating item 0 forever. */
const rotate = (n: number, seq: number) => (n === 0 ? 0 : seq % n);

export type Picker = (n: number, seq: number) => number;

/**
 * Take `count` items from `pool`, preferring not to repeat.
 *
 * A challenge that shows the same drill twice is not a challenge, so the pool
 * is exhausted before anything is reused. Reuse is still allowed rather than
 * truncating the run: a short pool should make the boss fight repetitive, not
 * make it impossible to attempt.
 */
function draw(pool: ContentRef[], count: number, pick: Picker, seq = 0): ContentRef[] {
  if (pool.length === 0) return [];
  const out: ContentRef[] = [];
  let remaining = [...pool];
  while (out.length < count) {
    if (remaining.length === 0) remaining = [...pool];
    const i = pick(remaining.length, seq++) % remaining.length;
    out.push(remaining[i]);
    remaining.splice(i, 1);
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Boss fight (§8 item 4)
 * ------------------------------------------------------------------ */

export interface BossPlan {
  topicId: string;
  contentIds: number[];
}

export interface BossPlanInput {
  topicId: string;
  /** Every available drill for the topic. */
  content: ContentRef[];
  pick?: Picker;
}

/**
 * Not enough material to run an honest boss fight.
 *
 * §8 says twelve items with no retries. Running it against four drills seen
 * four times each would test recall of this morning's drill order rather than
 * the topic, and the reward is `mastered` — the strongest claim the app makes.
 * So a thin pool blocks the challenge instead of cheapening it, and the caller
 * is expected to send the topic to the generator first.
 */
export const BOSS_MIN_POOL = 8;

export function planBoss(input: BossPlanInput): BossPlan | null {
  const { topicId, content, pick = rotate } = input;
  const pool = content.filter((c) => c.topicId === topicId);
  if (pool.length < BOSS_MIN_POOL) return null;

  // Hardest last. The unaided challenge should finish on the material that
  // actually decides whether the topic is known, not open on it and lose the
  // learner in the first thirty seconds.
  const ordered = draw(pool, TOPIC.BOSS_ITEMS, pick).sort((a, b) => a.difficulty - b.difficulty);
  return { topicId, contentIds: ordered.map((c) => c.id) };
}

export interface BossProgress {
  answered: number;
  correct: number;
  remaining: number;
  /** True once no sequence of remaining answers can change the verdict. */
  settled: boolean;
  /** Null while the run is still live. */
  passed: boolean | null;
}

/**
 * Score a boss fight from the answers so far.
 *
 * `settled` exists for the UI, not for the gate: once ten are right the run is
 * won and once three are wrong it is lost, and pretending otherwise for two
 * more items is theatre. The run is still played out to the end so the attempt
 * record carries a full picture, but the verdict is already fixed.
 */
export function bossProgress(answers: boolean[], items = TOPIC.BOSS_ITEMS): BossProgress {
  const answered = Math.min(answers.length, items);
  const correct = answers.slice(0, items).filter(Boolean).length;
  const remaining = items - answered;
  const canStillPass = correct + remaining >= TOPIC.BOSS_PASS;
  const alreadyPassed = correct >= TOPIC.BOSS_PASS;
  const settled = alreadyPassed || !canStillPass;
  return {
    answered,
    correct,
    remaining,
    settled,
    passed: settled ? alreadyPassed : remaining === 0 ? correct >= TOPIC.BOSS_PASS : null,
  };
}

/* ------------------------------------------------------------------ *
 * Gauntlet Run — `sprint` in the code (§8 item 3)
 * ------------------------------------------------------------------ */

export const SPRINT = {
  /** §8: "a timed 10-item mixed-topic sprint". */
  ITEMS: 10,
  /** §8: "Three lives." */
  LIVES: 3,
} as const;

export type SprintOutcome = 'cleared' | 'out_of_lives' | 'abandoned';

export interface SprintPlan {
  contentIds: number[];
  /** Error codes the run covers, in the order §4's weighting chose them. */
  errors: string[];
}

export interface SprintPlanInput {
  /** Every non-resolved error, with the state §4's weight formula reads. */
  errors: { code: string; state: ErrorState }[];
  /** Available drills for each error code. */
  contentByError: Map<string, ContentRef[]>;
  now: string;
  pick?: Picker;
}

/**
 * Build a Gauntlet Run.
 *
 * §8: "drawn only from your active error list" — *only*. No topic material, no
 * review items, and nothing for an error that has reached `resolved`. The
 * weighting is §4's, reused rather than reinvented, so the sprint pulls on the
 * same errors the warm-up does and the two mechanics cannot disagree about
 * what the learner's worst problem is.
 *
 * Returns null when the error list cannot fill ten items. A four-item sprint
 * padded out with repeats is not the mechanic §8 describes, and an empty error
 * list is good news that should be reported as such by the caller.
 */
export function planSprint(input: SprintPlanInput): SprintPlan | null {
  const { errors, contentByError, now, pick = rotate } = input;

  const live = errors.filter((e) => e.state.status !== 'resolved');
  const weighted = selectWarmup(
    live.map((e) => ({ item: e.code, state: e.state })),
    live.length,
    now,
  );

  const contentIds: number[] = [];
  const used = new Set<number>();
  const codes: string[] = [];
  let seq = 0;

  // Round-robin over the weighted errors rather than emptying the worst error's
  // pool first: §8 calls it *mixed-topic*, and ten items on one error is the
  // warm-up with a timer on it.
  for (let round = 0; contentIds.length < SPRINT.ITEMS && round < SPRINT.ITEMS; round++) {
    for (const w of weighted) {
      if (contentIds.length >= SPRINT.ITEMS) break;
      const pool = (contentByError.get(w.item) ?? []).filter((c) => !used.has(c.id));
      if (pool.length === 0) continue;
      const chosen = pool[pick(pool.length, seq++) % pool.length];
      used.add(chosen.id);
      contentIds.push(chosen.id);
      if (!codes.includes(w.item)) codes.push(w.item);
    }
  }

  if (contentIds.length < SPRINT.ITEMS) return null;
  return { contentIds, errors: codes };
}

export interface SprintProgress {
  answered: number;
  correct: number;
  livesLeft: number;
  /** Null while the run is still live. */
  outcome: SprintOutcome | null;
}

/**
 * Score a Gauntlet Run from the answers so far.
 *
 * Unlike the boss fight this one really does stop early — three wrong answers
 * ends the run where it stands, which is what makes the lives mean anything.
 */
export function sprintProgress(answers: boolean[], items = SPRINT.ITEMS): SprintProgress {
  let correct = 0;
  let lost = 0;
  let answered = 0;

  for (const ok of answers) {
    if (answered >= items || lost >= SPRINT.LIVES) break;
    answered++;
    if (ok) correct++;
    else lost++;
  }

  const livesLeft = SPRINT.LIVES - lost;
  const outcome: SprintOutcome | null =
    livesLeft === 0 ? 'out_of_lives' : answered >= items ? 'cleared' : null;

  return { answered, correct, livesLeft, outcome };
}

/* ------------------------------------------------------------------ *
 * Leaderboard (§8: "Leaderboard against your own past runs")
 * ------------------------------------------------------------------ */

export interface SprintRecord {
  id: number;
  startedAt: string;
  outcome: SprintOutcome;
  correct: number;
  livesLeft: number;
  durationMs: number;
}

/**
 * Rank finished runs.
 *
 * Only cleared runs are ranked. §8 makes this a speed builder, and a run that
 * ended on the third life is not a slow success, it is a different thing — it
 * belongs in the history, not on the board. Ties on time break on lives left,
 * which rewards clearing it clean.
 */
export function leaderboard(runs: SprintRecord[], limit = 10): SprintRecord[] {
  return runs
    .filter((r) => r.outcome === 'cleared')
    .sort((a, b) => a.durationMs - b.durationMs || b.livesLeft - a.livesLeft)
    .slice(0, limit);
}

/** The run to beat, or null on a first attempt. */
export function personalBest(runs: SprintRecord[]): SprintRecord | null {
  return leaderboard(runs, 1)[0] ?? null;
}
