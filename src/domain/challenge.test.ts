import { describe, expect, it } from 'vitest';
import {
  BOSS_MIN_POOL,
  SPRINT,
  bossProgress,
  leaderboard,
  personalBest,
  planBoss,
  planSprint,
  sprintProgress,
  type SprintRecord,
} from './challenge';
import { TOPIC, newErrorState, type ErrorState, type ErrorStatus } from './mastery';
import type { ContentRef } from './session';

const NOW = '2026-08-07T12:00:00.000Z';

function content(
  n: number,
  topicId: string,
  opts: { from?: number; targetsError?: string | null } = {},
): ContentRef[] {
  const from = opts.from ?? 1;
  return Array.from({ length: n }, (_, i) => ({
    id: from + i,
    topicId,
    kind: 'transform',
    difficulty: (i % 5) + 1,
    targetsError: opts.targetsError ?? null,
  }));
}

function err(severity: number, status: ErrorStatus = 'active', occurrences = 3): ErrorState {
  return { ...newErrorState(severity, status), occurrences, lastOccurred: NOW };
}

describe('boss fight: planning', () => {
  it('plans exactly 12 items', () => {
    const plan = planBoss({ topicId: 'b1.verb.imperfecto', content: content(20, 'b1.verb.imperfecto') });
    expect(plan!.contentIds).toHaveLength(TOPIC.BOSS_ITEMS);
  });

  it('draws only from the topic under test', () => {
    const pool = [
      ...content(12, 'b1.verb.imperfecto'),
      ...content(12, 'b1.mood.subj_presente', { from: 100 }),
    ];
    const plan = planBoss({ topicId: 'b1.verb.imperfecto', content: pool });
    expect(plan!.contentIds.every((id) => id < 100)).toBe(true);
  });

  it('does not repeat an item while unseen material is left', () => {
    const plan = planBoss({ topicId: 't', content: content(12, 't') });
    expect(new Set(plan!.contentIds).size).toBe(TOPIC.BOSS_ITEMS);
  });

  it('refuses to run against a pool too thin to be honest', () => {
    expect(planBoss({ topicId: 't', content: content(BOSS_MIN_POOL - 1, 't') })).toBeNull();
    expect(planBoss({ topicId: 't', content: content(BOSS_MIN_POOL, 't') })).not.toBeNull();
  });

  it('orders the run easiest first', () => {
    const pool = content(20, 't');
    const byId = new Map(pool.map((c) => [c.id, c]));
    const plan = planBoss({ topicId: 't', content: pool });
    const difficulties = plan!.contentIds.map((id) => byId.get(id)!.difficulty);
    expect([...difficulties].sort((a, b) => a - b)).toEqual(difficulties);
  });
});

describe('boss fight: scoring', () => {
  const answers = (right: number, wrong: number) => [
    ...Array(right).fill(true),
    ...Array(wrong).fill(false),
  ];

  it('passes at exactly BOSS_PASS correct', () => {
    expect(bossProgress(answers(TOPIC.BOSS_PASS, 2)).passed).toBe(true);
  });

  it('fails one short of the bar', () => {
    expect(bossProgress(answers(TOPIC.BOSS_PASS - 1, 3)).passed).toBe(false);
  });

  it('stays undecided mid-run', () => {
    const p = bossProgress(answers(5, 1));
    expect(p.passed).toBeNull();
    expect(p.settled).toBe(false);
    expect(p.remaining).toBe(TOPIC.BOSS_ITEMS - 6);
  });

  it('settles early once the bar is reached', () => {
    const p = bossProgress(answers(TOPIC.BOSS_PASS, 0));
    expect(p.settled).toBe(true);
    expect(p.passed).toBe(true);
    expect(p.remaining).toBeGreaterThan(0);
  });

  it('settles early once the bar is unreachable', () => {
    // Three wrong out of twelve leaves nine possible, one short of ten.
    const p = bossProgress(answers(0, 3));
    expect(p.settled).toBe(true);
    expect(p.passed).toBe(false);
  });

  it('a fresh run is undecided, not a failure', () => {
    expect(bossProgress([]).passed).toBeNull();
  });
});

describe('gauntlet run: planning', () => {
  const errs = [
    { code: 'gen.tema', state: err(5) },
    { code: 'prep.despues_de', state: err(4) },
    { code: 'verb.ser_estar', state: err(3) },
  ];
  const byError = new Map<string, ContentRef[]>([
    ['gen.tema', content(6, 'a1.noun.gender', { from: 1, targetsError: 'gen.tema' })],
    ['prep.despues_de', content(6, 'a2.prep.basic', { from: 100, targetsError: 'prep.despues_de' })],
    ['verb.ser_estar', content(6, 'a1.verb.ser_estar', { from: 200, targetsError: 'verb.ser_estar' })],
  ]);

  it('plans exactly 10 items', () => {
    const plan = planSprint({ errors: errs, contentByError: byError, now: NOW });
    expect(plan!.contentIds).toHaveLength(SPRINT.ITEMS);
  });

  it('never repeats an item', () => {
    const plan = planSprint({ errors: errs, contentByError: byError, now: NOW });
    expect(new Set(plan!.contentIds).size).toBe(SPRINT.ITEMS);
  });

  it('is mixed rather than draining the worst error first', () => {
    // §8 calls it a mixed-topic sprint. Ten items on one error is the warm-up
    // with a timer on it.
    const plan = planSprint({ errors: errs, contentByError: byError, now: NOW });
    expect(plan!.errors.length).toBeGreaterThanOrEqual(3);
    const firstThree = plan!.contentIds.slice(0, 3);
    expect(new Set(firstThree.map((id) => Math.floor(id / 100))).size).toBe(3);
  });

  it('excludes resolved errors entirely', () => {
    const plan = planSprint({
      errors: [...errs, { code: 'done', state: err(5, 'resolved') }],
      contentByError: new Map([
        ...byError,
        ['done', content(10, 'x', { from: 900, targetsError: 'done' })],
      ]),
      now: NOW,
    });
    expect(plan!.errors).not.toContain('done');
    expect(plan!.contentIds.every((id) => id < 900)).toBe(true);
  });

  it('returns null rather than padding a short error list', () => {
    const thin = new Map<string, ContentRef[]>([['gen.tema', content(4, 'a1.noun.gender')]]);
    expect(
      planSprint({ errors: [{ code: 'gen.tema', state: err(5) }], contentByError: thin, now: NOW }),
    ).toBeNull();
  });

  it('returns null on an empty error list', () => {
    expect(planSprint({ errors: [], contentByError: new Map(), now: NOW })).toBeNull();
  });
});

describe('gauntlet run: scoring', () => {
  it('clears on ten answers with a life left', () => {
    const p = sprintProgress([...Array(8).fill(true), false, true]);
    expect(p.outcome).toBe('cleared');
    expect(p.correct).toBe(9);
    expect(p.livesLeft).toBe(2);
  });

  it('ends the run on the third life lost, mid-sprint', () => {
    const p = sprintProgress([false, true, false, false, true, true]);
    expect(p.outcome).toBe('out_of_lives');
    expect(p.answered).toBe(4); // stops where it stands, later answers ignored
    expect(p.livesLeft).toBe(0);
  });

  it('survives exactly two wrong', () => {
    const p = sprintProgress([false, false, ...Array(8).fill(true)]);
    expect(p.outcome).toBe('cleared');
    expect(p.livesLeft).toBe(1);
  });

  it('is live until ten are answered', () => {
    expect(sprintProgress([true, true, true]).outcome).toBeNull();
  });
});

describe('gauntlet run: leaderboard', () => {
  const run = (o: Partial<SprintRecord>): SprintRecord => ({
    id: 1,
    startedAt: NOW,
    outcome: 'cleared',
    correct: 10,
    livesLeft: 3,
    durationMs: 60_000,
    ...o,
  });

  it('ranks by time, fastest first', () => {
    const board = leaderboard([
      run({ id: 1, durationMs: 90_000 }),
      run({ id: 2, durationMs: 45_000 }),
      run({ id: 3, durationMs: 70_000 }),
    ]);
    expect(board.map((r) => r.id)).toEqual([2, 3, 1]);
  });

  it('breaks ties on lives left', () => {
    const board = leaderboard([
      run({ id: 1, durationMs: 60_000, livesLeft: 1 }),
      run({ id: 2, durationMs: 60_000, livesLeft: 3 }),
    ]);
    expect(board[0].id).toBe(2);
  });

  it('does not rank runs that ended out of lives', () => {
    const board = leaderboard([
      run({ id: 1, outcome: 'out_of_lives', durationMs: 10_000 }),
      run({ id: 2, outcome: 'abandoned', durationMs: 20_000 }),
      run({ id: 3, durationMs: 99_000 }),
    ]);
    expect(board.map((r) => r.id)).toEqual([3]);
  });

  it('has no personal best before the first clean run', () => {
    expect(personalBest([run({ outcome: 'out_of_lives' })])).toBeNull();
    expect(personalBest([])).toBeNull();
  });
});
