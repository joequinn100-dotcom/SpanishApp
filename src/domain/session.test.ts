import { describe, it, expect } from 'vitest';
import { newErrorState, type ErrorState } from './mastery';
import {
  planSession,
  warmupGuaranteeHeld,
  sessionProgress,
  reviewOutcome,
  WARMUP_MIN,
  REVIEW_ITEMS,
  type ContentRef,
  type SessionPlan,
} from './session';

const NOW = '2026-08-06T12:00:00.000Z';
const RECENT = '2026-08-04T12:00:00.000Z';

function err(severity: number, over: Partial<ErrorState> = {}): ErrorState {
  return { ...newErrorState(severity), occurrences: 10, lastOccurred: RECENT, ...over };
}

let nextId = 1;
function content(topicId: string, targetsError: string | null, difficulty = 2): ContentRef {
  return { id: nextId++, topicId, kind: 'drill_cloze', difficulty, targetsError };
}

/** Five errors, each with three drills written for it. */
function fixture(errors: { code: string; state: ErrorState }[]) {
  const contentByError = new Map<string, ContentRef[]>();
  for (const e of errors) {
    contentByError.set(
      e.code,
      [0, 1, 2].map(() => content('b2.mood.subj_imperfecto', e.code)),
    );
  }
  return contentByError;
}

describe('planSession', () => {
  const errors = [
    { code: 'noun.greek_ma', state: err(5) },
    { code: 'verb.futuro_vs_condicional', state: err(5) },
    { code: 'prep.despues_de', state: err(4) },
    { code: 'mood.subj_cuando', state: err(3) },
    { code: 'lex.falso_amigo', state: err(2) },
  ];

  it('opens with warm-up before topic work, always', () => {
    const plan = planSession({
      errors,
      contentByError: fixture(errors),
      topicContent: [0, 1, 2].map(() => content('b2.mood.si_hipotetico', null)),
      focusTopicId: 'b2.mood.si_hipotetico',
      now: NOW,
    });
    const firstTopic = plan.items.findIndex((i) => i.source === 'topic');
    const lastWarmup = plan.items.map((i) => i.source).lastIndexOf('warmup');
    expect(lastWarmup).toBeLessThan(firstTopic);
  });

  it('honours §4’s top-3-severity guarantee', () => {
    const plan = planSession({
      errors,
      contentByError: fixture(errors),
      topicContent: [],
      focusTopicId: null,
      now: NOW,
    });
    expect(warmupGuaranteeHeld(plan, errors)).toBe(true);
  });

  it('holds the guarantee even when the top errors are stale and low-weighted', () => {
    // Severity 5 but silent for months: weight collapses, but §4 says these are
    // still guaranteed a slot. This is the case a plain sort gets wrong.
    const skewed = [
      { code: 'noun.greek_ma', state: err(5, { lastOccurred: '2026-01-01T00:00:00.000Z' }) },
      { code: 'verb.futuro_vs_condicional', state: err(5, { lastOccurred: '2026-01-01T00:00:00.000Z' }) },
      { code: 'prep.despues_de', state: err(1, { occurrences: 400 }) },
      { code: 'mood.subj_cuando', state: err(1, { occurrences: 400 }) },
    ];
    const plan = planSession({
      errors: skewed,
      contentByError: fixture(skewed),
      topicContent: [],
      focusTopicId: null,
      now: NOW,
    });
    expect(warmupGuaranteeHeld(plan, skewed)).toBe(true);
  });

  it('never plans fewer than the §4 floor when content exists', () => {
    const plan = planSession({
      errors,
      contentByError: fixture(errors),
      topicContent: [],
      focusTopicId: null,
      now: NOW,
    });
    expect(plan.items.filter((i) => i.source === 'warmup').length).toBeGreaterThanOrEqual(
      WARMUP_MIN,
    );
  });

  it('tops up from the highest-weighted errors when few errors have drills', () => {
    // Only two errors have content written; the warm-up must still reach the
    // floor by revisiting them rather than shrinking.
    const partial = new Map<string, ContentRef[]>();
    partial.set('noun.greek_ma', [0, 1, 2, 3].map(() => content('t', 'noun.greek_ma')));
    partial.set(
      'verb.futuro_vs_condicional',
      [0, 1, 2, 3].map(() => content('t', 'verb.futuro_vs_condicional')),
    );

    const plan = planSession({
      errors,
      contentByError: partial,
      topicContent: [],
      focusTopicId: null,
      now: NOW,
    });
    expect(plan.items.length).toBeGreaterThanOrEqual(WARMUP_MIN);
    expect(new Set(plan.items.map((i) => i.errorCode)).size).toBe(2);
  });

  it('never repeats a drill within one session', () => {
    const plan = planSession({
      errors,
      contentByError: fixture(errors),
      topicContent: [0, 1, 2, 3].map(() => content('b2.mood.si_hipotetico', null)),
      focusTopicId: 'b2.mood.si_hipotetico',
      now: NOW,
    });
    const ids = plan.items.map((i) => i.contentId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('skips errors with no drill written rather than planning a hole', () => {
    const plan = planSession({
      errors,
      contentByError: new Map(),
      topicContent: [content('t', null)],
      focusTopicId: 't',
      now: NOW,
    });
    expect(plan.items.every((i) => i.source === 'topic')).toBe(true);
    expect(plan.items).toHaveLength(1);
  });

  it('orders the topic block easiest first', () => {
    const hard = content('t', null, 5);
    const easy = content('t', null, 1);
    const mid = content('t', null, 3);
    const plan = planSession({
      errors: [],
      contentByError: new Map(),
      topicContent: [hard, easy, mid],
      focusTopicId: 't',
      now: NOW,
    });
    expect(plan.items.map((i) => i.contentId)).toEqual([easy.id, mid.id, hard.id]);
  });

  it('plans nothing at all when there is no content anywhere', () => {
    const plan = planSession({
      errors,
      contentByError: new Map(),
      topicContent: [],
      focusTopicId: null,
      now: NOW,
    });
    expect(plan.items).toEqual([]);
  });
});

describe('warmupGuaranteeHeld', () => {
  it('is vacuously true with no active errors', () => {
    expect(warmupGuaranteeHeld({ items: [], focusTopicId: null, warmupErrors: [] }, [])).toBe(true);
  });

  it('fails a plan that skipped the severe errors', () => {
    const errors = [
      { code: 'a', state: err(5) },
      { code: 'b', state: err(5) },
      { code: 'c', state: err(5) },
      { code: 'd', state: err(1) },
    ];
    const plan = {
      items: [{ contentId: 1, source: 'warmup' as const, topicId: 't', errorCode: 'd' }],
      focusTopicId: null,
      warmupErrors: ['d'],
    };
    expect(warmupGuaranteeHeld(plan, errors)).toBe(false);
  });
});

describe('sessionProgress', () => {
  const plan = {
    items: [1, 2, 3].map((id) => ({
      contentId: id,
      source: 'topic' as const,
      topicId: 't',
      errorCode: null,
    })),
    focusTopicId: 't',
    warmupErrors: [],
  };

  it('points at the item the cursor is on', () => {
    expect(sessionProgress(plan, 0).current?.contentId).toBe(1);
    expect(sessionProgress(plan, 2).current?.contentId).toBe(3);
  });

  it('reports done at the end, with no current item', () => {
    const p = sessionProgress(plan, 3);
    expect(p.done).toBe(true);
    expect(p.current).toBeNull();
    expect(p.fraction).toBe(1);
  });

  it('survives a cursor past the end rather than throwing', () => {
    const p = sessionProgress(plan, 99);
    expect(p.done).toBe(true);
    expect(p.answered).toBe(3);
    expect(p.remaining).toBe(0);
  });

  it('treats an empty plan as complete', () => {
    expect(sessionProgress({ items: [], focusTopicId: null, warmupErrors: [] }, 0).done).toBe(true);
  });
});

describe('spaced reviews (SPEC §4)', () => {
  const errors = [
    { code: 'noun.greek_ma', state: err(5) },
    { code: 'verb.preterito_persona', state: err(5) },
    { code: 'prep.despues_de', state: err(4) },
  ];

  const dueFor = (topicId: string, dueAt: string, n = 8) => ({
    topicId,
    dueAt,
    content: Array.from({ length: n }, () => content(topicId, null, 3)),
  });

  it('places the review after the warm-up and before new material', () => {
    // A review must be unaided, so it cannot follow the topic block that just
    // re-taught the same material.
    const plan = planSession({
      errors,
      contentByError: fixture(errors),
      topicContent: [content('focus', null), content('focus', null)],
      focusTopicId: 'focus',
      due: [dueFor('b1.verb.preterito', '2026-08-01T00:00:00.000Z')],
      now: NOW,
    });
    const sources = plan.items.map((i) => i.source);
    expect(sources.lastIndexOf('warmup')).toBeLessThan(sources.indexOf('review'));
    expect(sources.lastIndexOf('review')).toBeLessThan(sources.indexOf('topic'));
  });

  it('serves the oldest debt and only one topic per session', () => {
    const plan = planSession({
      errors: [],
      contentByError: new Map(),
      topicContent: [],
      focusTopicId: null,
      due: [
        dueFor('newer', '2026-08-05T00:00:00.000Z'),
        dueFor('older', '2026-07-20T00:00:00.000Z'),
      ],
      now: NOW,
    });
    expect(plan.reviewTopics).toEqual(['older']);
    expect(new Set(plan.items.map((i) => i.topicId))).toEqual(new Set(['older']));
  });

  it('plans exactly REVIEW_ITEMS when enough content exists', () => {
    const plan = planSession({
      errors: [],
      contentByError: new Map(),
      topicContent: [],
      focusTopicId: null,
      due: [dueFor('t', '2026-08-01T00:00:00.000Z', 20)],
      now: NOW,
    });
    expect(plan.items.filter((i) => i.source === 'review')).toHaveLength(REVIEW_ITEMS);
  });

  it('offers no review at all when the topic has too little content', () => {
    // A two-item review cannot be "clean" in any meaningful sense, so offering
    // it as a formality would cheapen the gate.
    const plan = planSession({
      errors: [],
      contentByError: new Map(),
      topicContent: [],
      focusTopicId: null,
      due: [dueFor('t', '2026-08-01T00:00:00.000Z', 2)],
      now: NOW,
    });
    expect(plan.items).toEqual([]);
    expect(plan.reviewTopics).toEqual([]);
  });

  it('never reuses a drill the warm-up already took', () => {
    const shared = content('b1.verb.preterito', 'noun.greek_ma');
    const byError = new Map([['noun.greek_ma', [shared]]]);
    const plan = planSession({
      errors: [{ code: 'noun.greek_ma', state: err(5) }],
      contentByError: byError,
      topicContent: [],
      focusTopicId: null,
      due: [{ topicId: 'b1.verb.preterito', dueAt: '2026-08-01T00:00:00.000Z', content: [shared, content('b1.verb.preterito', null), content('b1.verb.preterito', null), content('b1.verb.preterito', null)] }],
      now: NOW,
    });
    const ids = plan.items.map((i) => i.contentId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('reviewOutcome', () => {
  const plan: SessionPlan = {
    items: [
      { contentId: 1, source: 'review', topicId: 't', errorCode: null },
      { contentId: 2, source: 'review', topicId: 't', errorCode: null },
      { contentId: 3, source: 'topic', topicId: 't', errorCode: null },
    ],
    focusTopicId: 't',
    warmupErrors: [],
    reviewTopics: ['t'],
  };

  it('is null while the block is unfinished — "not yet" is not "failed"', () => {
    expect(reviewOutcome([{ source: 'review', topicId: 't', correct: true }], plan, 't')).toBeNull();
  });

  it('passes only when every item is right — §4 says clean, not 80%', () => {
    const all = [
      { source: 'review', topicId: 't', correct: true },
      { source: 'review', topicId: 't', correct: true },
    ];
    expect(reviewOutcome(all, plan, 't')).toBe(true);

    const one = [
      { source: 'review', topicId: 't', correct: true },
      { source: 'review', topicId: 't', correct: false },
    ];
    expect(reviewOutcome(one, plan, 't')).toBe(false);
  });

  it('ignores answers from the topic block', () => {
    const mixed = [
      { source: 'review', topicId: 't', correct: true },
      { source: 'review', topicId: 't', correct: true },
      { source: 'topic', topicId: 't', correct: false },
    ];
    expect(reviewOutcome(mixed, plan, 't')).toBe(true);
  });

  it('is null for a topic the session never reviewed', () => {
    expect(reviewOutcome([], plan, 'other')).toBeNull();
  });
});
