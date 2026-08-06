import { describe, it, expect } from 'vitest';
import {
  newVocabState,
  reviewVocab,
  markSpontaneous,
  isDue,
  promptDirection,
  selectVocab,
  SRS,
  type VocabState,
} from './srs';

const NOW = '2026-08-06T12:00:00.000Z';
const days = (from: string, to: string) =>
  Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000);

/** Walk a card forward through n successful reviews. */
function known(n: number, recall: 'good' | 'easy' = 'good'): VocabState {
  let s = newVocabState();
  for (let i = 0; i < n; i++) s = reviewVocab(s, recall, NOW);
  return s;
}

describe('reviewVocab — intervals', () => {
  it('schedules the first two reviews on SM-2’s fixed steps', () => {
    const first = reviewVocab(newVocabState(), 'good', NOW);
    expect(days(NOW, first.dueAt!)).toBe(SRS.FIRST_INTERVAL);

    const second = reviewVocab(first, 'good', NOW);
    expect(days(NOW, second.dueAt!)).toBe(SRS.SECOND_INTERVAL);
  });

  it('drives later intervals from the ease factor', () => {
    const third = known(3);
    expect(days(NOW, third.dueAt!)).toBeGreaterThan(SRS.SECOND_INTERVAL);
  });

  it('grows faster when everything is easy than when everything is merely good', () => {
    expect(known(4, 'easy').intervalDays).toBeGreaterThan(known(4, 'good').intervalDays);
  });

  it('caps the interval so a word cannot vanish until after the exam', () => {
    let s = known(3, 'easy');
    for (let i = 0; i < 20; i++) s = reviewVocab(s, 'easy', NOW);
    expect(s.intervalDays).toBeLessThanOrEqual(SRS.MAX_INTERVAL_DAYS);
  });
});

describe('reviewVocab — lapses', () => {
  it('sends a forgotten word back to tomorrow, not to zero', () => {
    const s = reviewVocab(known(3), 'again', NOW);
    expect(s.reps).toBe(0);
    expect(days(NOW, s.dueAt!)).toBe(SRS.LAPSE_INTERVAL);
  });

  it('counts a lapse only when the word was previously known', () => {
    // Failing a brand-new card is not forgetting; it is not knowing yet.
    expect(reviewVocab(newVocabState(), 'again', NOW).lapses).toBe(0);
    expect(reviewVocab(known(2), 'again', NOW).lapses).toBe(1);
  });

  it('never lets ease fall below the floor', () => {
    let s = known(3);
    for (let i = 0; i < 20; i++) s = reviewVocab(s, 'again', NOW);
    expect(s.ease).toBeGreaterThanOrEqual(SRS.MIN_EASE);
  });

  it('demotes to recognizing but never back to new', () => {
    expect(reviewVocab(known(4), 'again', NOW).stage).toBe('recognizing');
    expect(reviewVocab(newVocabState(), 'again', NOW).stage).toBe('new');
  });
});

describe('stages', () => {
  it('moves new → recognizing on the first success', () => {
    expect(reviewVocab(newVocabState(), 'good', NOW).stage).toBe('recognizing');
  });

  it('reaches using after enough consecutive successes', () => {
    expect(known(SRS.USING_REPS).stage).toBe('using');
    expect(known(SRS.USING_REPS - 1).stage).toBe('recognizing');
  });

  it('never grants the top stage from a card review, however well it goes', () => {
    // The whole point: SM-2 measures recall on demand. Whether a word has
    // entered your speech is a different question, and §4 answers it with
    // spontaneous evidence rather than with a button press.
    let s = newVocabState();
    for (let i = 0; i < 30; i++) s = reviewVocab(s, 'easy', NOW);
    expect(s.stage).toBe('using');
  });

  it('grants it only from unprompted use', () => {
    expect(markSpontaneous(known(2)).stage).toBe('spontaneous');
  });

  it('does not demote a spontaneous word on an ordinary review', () => {
    const s = markSpontaneous(known(3));
    expect(reviewVocab(s, 'good', NOW).stage).toBe('spontaneous');
  });
});

describe('isDue', () => {
  it('treats a never-reviewed card as due', () => {
    expect(isDue(newVocabState(), NOW)).toBe(true);
  });

  it('is not due before its date', () => {
    const s = reviewVocab(newVocabState(), 'good', NOW);
    expect(isDue(s, NOW)).toBe(false);
    expect(isDue(s, '2026-08-08T12:00:00.000Z')).toBe(true);
  });
});

describe('promptDirection', () => {
  it('asks for recognition on sight and production once it is known', () => {
    expect(promptDirection('new')).toBe('es_to_en');
    expect(promptDirection('recognizing')).toBe('en_to_es');
    expect(promptDirection('using')).toBe('en_to_es');
  });
});

describe('selectVocab', () => {
  const card = (id: string, state: VocabState) => ({ item: id, state });

  it('puts due reviews before new words', () => {
    const overdue = { ...known(2), dueAt: '2026-07-01T00:00:00.000Z' };
    const cards = [card('nuevo', newVocabState()), card('viejo', overdue)];
    expect(selectVocab(cards, 5, NOW).map((c) => c.item)).toEqual(['viejo', 'nuevo']);
  });

  it('pays the oldest debt first', () => {
    const cards = [
      card('b', { ...known(2), dueAt: '2026-08-01T00:00:00.000Z' }),
      card('a', { ...known(2), dueAt: '2026-07-01T00:00:00.000Z' }),
    ];
    expect(selectVocab(cards, 5, NOW).map((c) => c.item)).toEqual(['a', 'b']);
  });

  it('caps new words so introductions never crowd out reviews', () => {
    const cards = Array.from({ length: 40 }, (_, i) => card(`w${i}`, newVocabState()));
    expect(selectVocab(cards, 20, NOW, 5)).toHaveLength(5);
  });

  it('leaves out cards that are not due yet', () => {
    const cards = [card('futuro', reviewVocab(newVocabState(), 'good', NOW))];
    expect(selectVocab(cards, 5, NOW)).toEqual([]);
  });

  it('returns nothing from an empty deck rather than throwing', () => {
    expect(selectVocab([], 5, NOW)).toEqual([]);
  });
});
