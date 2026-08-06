import { describe, expect, it } from 'vitest';
import {
  ERR,
  TOPIC,
  addDays,
  errorTransition,
  newErrorState,
  newTopicState,
  recencyDecay,
  selectWarmup,
  topicTransition,
  warmupWeight,
  type ErrorState,
  type TopicState,
} from './mastery';

const T0 = '2026-08-06T12:00:00.000Z';
const at = (d: number) => addDays(T0, d);

/** Drive n attempts through the machine at a fixed rolling accuracy. */
function drill(s: TopicState, n: number, correct: boolean, accuracy: number, now = T0) {
  for (let i = 0; i < n; i++) {
    s = topicTransition(s, { type: 'attempt', correct, rollingAccuracy: accuracy }, now);
  }
  return s;
}

/** n clean productions. */
function clean(s: ErrorState, n: number, now = T0) {
  for (let i = 0; i < n; i++) s = errorTransition(s, { type: 'avoided' }, now);
  return s;
}

describe('topic: locked → available', () => {
  it('unlocks only when prereqs are satisfied', () => {
    const s = topicTransition(newTopicState('locked'), { type: 'prereqs_satisfied' }, T0);
    expect(s.status).toBe('available');
  });

  it('never demotes a topic already in progress', () => {
    for (const st of ['studying', 'consolidating', 'mastered'] as const) {
      const s = topicTransition(newTopicState(st), { type: 'prereqs_satisfied' }, T0);
      expect(s.status).toBe(st);
    }
  });
});

describe('topic: available → studying', () => {
  it('moves on the first attempt logged, right or wrong', () => {
    for (const correct of [true, false]) {
      const s = topicTransition(
        newTopicState('available'),
        { type: 'attempt', correct, rollingAccuracy: correct ? 1 : 0 },
        T0,
      );
      expect(s.status).toBe('studying');
      expect(s.attempts).toBe(1);
      expect(s.firstSeen).toBe(T0);
    }
  });
});

describe('topic: studying → consolidating', () => {
  it('requires BOTH ≥80% accuracy and ≥12 attempts', () => {
    const s = drill(newTopicState('studying'), TOPIC.MIN_ATTEMPTS, true, 0.85);
    expect(s.status).toBe('consolidating');
    expect(s.consolidatingSince).toBe(T0);
    expect(s.nextReviewAt).toBe(addDays(T0, 3));
  });

  it('does not promote on high accuracy with too few attempts', () => {
    const s = drill(newTopicState('studying'), TOPIC.MIN_ATTEMPTS - 1, true, 1.0);
    expect(s.status).toBe('studying');
  });

  it('does not promote on enough attempts below the accuracy gate', () => {
    const s = drill(newTopicState('studying'), 20, true, 0.79);
    expect(s.status).toBe('studying');
  });

  it('promotes exactly at the boundary (0.80, 12)', () => {
    const s = drill(newTopicState('studying'), TOPIC.MIN_ATTEMPTS, true, 0.8);
    expect(s.status).toBe('consolidating');
  });
});

describe('topic: consolidating → mastered', () => {
  const consolidating = (): TopicState =>
    drill(newTopicState('studying'), TOPIC.MIN_ATTEMPTS, true, 0.9);

  it('needs two clean reviews AND a spontaneous use', () => {
    let s = consolidating();
    s = topicTransition(s, { type: 'review', passed: true }, at(3));
    s = topicTransition(s, { type: 'review', passed: true }, at(13));
    expect(s.status).toBe('consolidating'); // reviews alone are not enough
    s = topicTransition(s, { type: 'spontaneous_use' }, at(14));
    expect(s.status).toBe('mastered');
    expect(s.masteredAt).toBe(at(14));
  });

  it('does not master on a spontaneous use without the reviews', () => {
    let s = consolidating();
    s = topicTransition(s, { type: 'spontaneous_use' }, at(1));
    s = topicTransition(s, { type: 'spontaneous_use' }, at(2));
    expect(s.status).toBe('consolidating');
  });

  it('does not master on one review plus a spontaneous use', () => {
    let s = consolidating();
    s = topicTransition(s, { type: 'review', passed: true }, at(3));
    s = topicTransition(s, { type: 'spontaneous_use' }, at(4));
    expect(s.status).toBe('consolidating');
    expect(s.reviewsPassed).toBe(1);
  });

  it('schedules the second review at +10d after the first passes', () => {
    let s = consolidating();
    s = topicTransition(s, { type: 'review', passed: true }, at(3));
    expect(s.nextReviewAt).toBe(addDays(at(3), 10));
  });

  it('restarts the review sequence when a review fails', () => {
    let s = consolidating();
    s = topicTransition(s, { type: 'review', passed: true }, at(3));
    s = topicTransition(s, { type: 'review', passed: false }, at(13));
    expect(s.reviewsPassed).toBe(0);
    expect(s.status).toBe('consolidating');
  });
});

describe('topic: mastered → studying (regression)', () => {
  const mastered = (): TopicState => {
    let s = drill(newTopicState('studying'), TOPIC.MIN_ATTEMPTS, true, 0.9);
    s = topicTransition(s, { type: 'review', passed: true }, at(3));
    s = topicTransition(s, { type: 'review', passed: true }, at(13));
    s = topicTransition(s, { type: 'spontaneous_use' }, at(14));
    return s;
  };

  it('regresses on any drill failure', () => {
    const s = topicTransition(
      mastered(),
      { type: 'attempt', correct: false, rollingAccuracy: 0.9 },
      at(20),
    );
    expect(s.status).toBe('studying');
    expect(s.masteredAt).toBeNull();
    expect(s.reviewsPassed).toBe(0);
  });

  it('regresses on a transcript error', () => {
    const s = topicTransition(mastered(), { type: 'transcript_error' }, at(20));
    expect(s.status).toBe('studying');
  });

  it('stays mastered on a correct attempt', () => {
    const s = topicTransition(
      mastered(),
      { type: 'attempt', correct: true, rollingAccuracy: 0.95 },
      at(20),
    );
    expect(s.status).toBe('mastered');
  });

  it('a high rolling accuracy does not rescue the failing attempt', () => {
    // The regression is unconditional in §4 — it does not consult accuracy.
    const s = topicTransition(
      mastered(),
      { type: 'attempt', correct: false, rollingAccuracy: 0.99 },
      at(20),
    );
    expect(s.status).toBe('studying');
  });
});

describe('error: active → improving', () => {
  it('promotes at a clean streak of 5', () => {
    const s = clean(newErrorState(4), ERR.IMPROVING_STREAK);
    expect(s.status).toBe('improving');
  });

  it('does not promote at 4', () => {
    const s = clean(newErrorState(4), ERR.IMPROVING_STREAK - 1);
    expect(s.status).toBe('active');
  });
});

describe('error: improving → consolidating', () => {
  it('needs streak ≥12 AND ≥2 spontaneous uses', () => {
    let s = clean(newErrorState(4), 12);
    expect(s.status).toBe('improving'); // streak alone is not enough
    s = errorTransition(s, { type: 'spontaneous_ok' }, T0);
    expect(s.status).toBe('improving'); // one spontaneous use is not enough
    s = errorTransition(s, { type: 'spontaneous_ok' }, T0);
    expect(s.status).toBe('consolidating');
    expect(s.consolidatingSince).toBe(T0);
  });

  it('does not promote on two spontaneous uses with a short streak', () => {
    let s = newErrorState(4);
    s = errorTransition(s, { type: 'spontaneous_ok' }, T0);
    s = errorTransition(s, { type: 'spontaneous_ok' }, T0);
    // streak is 2 from the spontaneous uses themselves — well short of 12
    expect(s.status).toBe('active');
    expect(s.spontaneousOk).toBe(2);
  });
});

describe('error: consolidating → resolved', () => {
  const consolidating = () => {
    let s = clean(newErrorState(3), 12);
    s = errorTransition(s, { type: 'spontaneous_ok' }, T0);
    s = errorTransition(s, { type: 'spontaneous_ok' }, T0);
    return s;
  };

  it('resolves after 21 silent days', () => {
    const s = errorTransition(consolidating(), { type: 'tick' }, at(ERR.RESOLVED_SILENT_DAYS));
    expect(s.status).toBe('resolved');
    expect(s.resolvedAt).toBe(at(21));
  });

  it('does not resolve at 20 days', () => {
    const s = errorTransition(consolidating(), { type: 'tick' }, at(20));
    expect(s.status).toBe('consolidating');
  });

  it('an occurrence inside the window restarts everything', () => {
    let s = errorTransition(consolidating(), { type: 'committed' }, at(20));
    expect(s.status).toBe('active');
    expect(s.consolidatingSince).toBeNull();
    s = errorTransition(s, { type: 'tick' }, at(60));
    expect(s.status).toBe('active');
  });
});

describe('error: occurrences and regression', () => {
  it('any occurrence resets the clean streak to zero', () => {
    let s = clean(newErrorState(4), 9);
    expect(s.cleanStreak).toBe(9);
    s = errorTransition(s, { type: 'committed' }, T0);
    expect(s.cleanStreak).toBe(0);
    expect(s.occurrences).toBe(1);
    expect(s.lastOccurred).toBe(T0);
  });

  it('resolved → regressed, and regressed is persistent', () => {
    let s: ErrorState = { ...newErrorState(4, 'resolved'), resolvedAt: T0 };
    s = errorTransition(s, { type: 'committed' }, at(30));
    expect(s.status).toBe('regressed');
    expect(s.resolvedAt).toBeNull();

    // It stays regressed through further clean work, until it re-earns improving.
    s = clean(s, ERR.IMPROVING_STREAK - 1, at(31));
    expect(s.status).toBe('regressed');
    s = errorTransition(s, { type: 'avoided' }, at(32));
    expect(s.status).toBe('improving');
  });

  it('a regressed error that recurs stays regressed', () => {
    let s = newErrorState(4, 'regressed');
    s = errorTransition(s, { type: 'committed' }, T0);
    expect(s.status).toBe('regressed');
  });

  it('improving falls back to active on a new occurrence', () => {
    let s = clean(newErrorState(4), ERR.IMPROVING_STREAK);
    expect(s.status).toBe('improving');
    s = errorTransition(s, { type: 'committed' }, T0);
    expect(s.status).toBe('active');
  });
});

describe('warm-up weighting', () => {
  it('applies §4 recency decay bands', () => {
    expect(recencyDecay(at(-1), T0)).toBe(1.0);
    expect(recencyDecay(at(-8), T0)).toBe(0.7);
    expect(recencyDecay(at(-30), T0)).toBe(0.4);
    expect(recencyDecay(at(-90), T0)).toBe(0.15);
    expect(recencyDecay(null, T0)).toBe(0.15);
  });

  it('weighs a regressed error above an identical active one', () => {
    const base = { ...newErrorState(4), occurrences: 8, lastOccurred: at(-1) };
    const active = warmupWeight({ ...base, status: 'active' }, T0);
    const regressed = warmupWeight({ ...base, status: 'regressed' }, T0);
    expect(regressed).toBeGreaterThan(active);
    expect(regressed / active).toBeCloseTo(1.4, 5);
  });

  it('scores a never-committed error at zero, per the spec formula', () => {
    const s = { ...newErrorState(5), occurrences: 0, lastOccurred: at(-1) };
    expect(warmupWeight(s, T0)).toBe(0);
  });

  it('gives resolved errors no weight', () => {
    const s = { ...newErrorState(5, 'resolved'), occurrences: 30, lastOccurred: at(-1) };
    expect(warmupWeight(s, T0)).toBe(0);
  });
});

describe('warm-up selection', () => {
  const mk = (id: string, severity: number, occurrences: number, status: ErrorState['status']) => ({
    item: id,
    state: { ...newErrorState(severity, status), occurrences, lastOccurred: at(-1) },
  });

  it('guarantees 2 of the top-3 highest-severity active errors', () => {
    // Two severity-5 errors that are rare, drowned by a flood of trivial ones.
    const errors = [
      mk('sev5-rare-a', 5, 1, 'active'),
      mk('sev5-rare-b', 5, 1, 'active'),
      ...Array.from({ length: 12 }, (_, i) => mk(`noise-${i}`, 2, 300, 'active')),
    ];
    const picked = selectWarmup(errors, 6, T0).map((w) => w.item);
    expect(picked).toContain('sev5-rare-a');
    expect(picked).toContain('sev5-rare-b');
    expect(picked).toHaveLength(6);
  });

  it('never picks resolved errors as filler', () => {
    const errors = [
      mk('active-1', 3, 5, 'active'),
      mk('resolved-1', 5, 90, 'resolved'),
      mk('resolved-2', 5, 90, 'resolved'),
    ];
    const picked = selectWarmup(errors, 6, T0).map((w) => w.item);
    expect(picked).toEqual(['active-1']);
  });

  it('returns no duplicates when a guaranteed item also ranks on weight', () => {
    const errors = [
      mk('hot', 5, 200, 'active'),
      mk('warm', 4, 40, 'active'),
      mk('cool', 2, 10, 'improving'),
    ];
    const picked = selectWarmup(errors, 5, T0).map((w) => w.item);
    expect(new Set(picked).size).toBe(picked.length);
  });

  it('respects the requested count', () => {
    const errors = Array.from({ length: 20 }, (_, i) => mk(`e${i}`, 3, 10, 'active'));
    expect(selectWarmup(errors, 8, T0)).toHaveLength(8);
  });
});
