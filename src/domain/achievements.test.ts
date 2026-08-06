import { describe, it, expect } from 'vitest';
import { achievements, dailyQuest, type Snapshot } from './achievements';

const EMPTY: Snapshot = {
  now: '2026-08-06T12:00:00.000Z',
  errors: [],
  topics: [],
  vocab: [],
  streakCurrent: 0,
  streakLongest: 0,
  sessions: 0,
  transcripts: 0,
  attempts: 0,
};

const error = (code: string, over: Partial<Snapshot['errors'][number]> = {}) => ({
  code, status: 'active', cleanStreak: 0, spontaneousOk: 0, resolvedAt: null, ...over,
});

const topic = (id: string, level: string, strand: string, status = 'locked') => ({
  id, level, strand, status, noSchedule: false,
});

describe('achievements', () => {
  it('earns nothing from an empty history', () => {
    // The failure mode §8 warns against is participation badges. Opening the
    // app must earn exactly zero of these.
    expect(achievements(EMPTY).filter((a) => a.earned)).toEqual([]);
  });

  it('always says what is still outstanding', () => {
    for (const a of achievements(EMPTY)) {
      expect(a.progress.length, a.code).toBeGreaterThan(3);
      expect(a.description.length, a.code).toBeGreaterThan(30);
    }
  });

  it('awards Greek Slayer only when the error is genuinely resolved', () => {
    const near = achievements({ ...EMPTY, errors: [error('noun.greek_ma', { status: 'consolidating', cleanStreak: 12 })] });
    expect(near.find((a) => a.code === 'greek_slayer')!.earned).toBe(false);

    const done = achievements({ ...EMPTY, errors: [error('noun.greek_ma', { status: 'resolved' })] });
    expect(done.find((a) => a.code === 'greek_slayer')!.earned).toBe(true);
  });

  it('awards Tender Ready only when every B2 professional topic is mastered', () => {
    const some = achievements({
      ...EMPTY,
      topics: [topic('a', 'B2', 'prof', 'mastered'), topic('b', 'B2', 'prof')],
    });
    expect(some.find((a) => a.code === 'tender_ready')!.earned).toBe(false);

    const all = achievements({
      ...EMPTY,
      topics: [topic('a', 'B2', 'prof', 'mastered'), topic('b', 'B2', 'prof', 'mastered')],
    });
    expect(all.find((a) => a.code === 'tender_ready')!.earned).toBe(true);
  });

  it('does not award a set achievement when the set is empty', () => {
    // Otherwise "all zero of zero topics" would count as clearing the strand.
    expect(achievements(EMPTY).find((a) => a.code === 'tender_ready')!.earned).toBe(false);
  });

  it('ignores unscheduled topics when clearing a set', () => {
    const s = achievements({
      ...EMPTY,
      topics: [
        topic('a', 'B1', 'verb', 'mastered'),
        { ...topic('b', 'B1', 'verb'), noSchedule: true },
      ],
    });
    expect(s.find((a) => a.code === 'past_master')!.earned).toBe(true);
  });

  it('counts spontaneous vocabulary, not merely reviewed vocabulary', () => {
    const reviewed = achievements({ ...EMPTY, vocab: Array(30).fill({ stage: 'using' }) });
    expect(reviewed.find((a) => a.code === 'own_words')!.earned).toBe(false);

    const spoken = achievements({ ...EMPTY, vocab: Array(20).fill({ stage: 'spontaneous' }) });
    expect(spoken.find((a) => a.code === 'own_words')!.earned).toBe(true);
  });

  it('uses the longest streak, so an earned badge is never taken away', () => {
    const s = achievements({ ...EMPTY, streakCurrent: 0, streakLongest: 14 });
    expect(s.find((a) => a.code === 'fortnight')!.earned).toBe(true);
  });
});

describe('dailyQuest', () => {
  it('is complete only when all three steps are', () => {
    expect(dailyQuest({ warmupItems: 1, topicItems: 1, vocabReviews: 5 }).complete).toBe(true);
    expect(dailyQuest({ warmupItems: 1, topicItems: 1, vocabReviews: 4 }).complete).toBe(false);
  });

  it('keeps the bar genuinely small — one item, one item, five cards', () => {
    // §8: "completable in 12 minutes on a bad day". A quest that needs a full
    // session is the one that breaks the streak.
    const q = dailyQuest({ warmupItems: 0, topicItems: 0, vocabReviews: 0 });
    expect(q.steps.map((s) => s.target)).toEqual([1, 1, 5]);
  });

  it('reports partial progress rather than a bare no', () => {
    const q = dailyQuest({ warmupItems: 1, topicItems: 0, vocabReviews: 3 });
    expect(q.steps[2].done).toBe(3);
    expect(q.steps[0].complete).toBe(true);
  });
});
