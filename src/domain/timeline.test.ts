import { describe, it, expect } from 'vitest';
import {
  spread,
  velocity,
  project,
  requiredPace,
  levelEstimate,
  positionOn,
  errorProgress,
  VELOCITY_WINDOW_DAYS,
  type LevelId,
} from './timeline';

const NOW = '2026-08-06T12:00:00.000Z';
const EXAM = '2026-12-01T00:00:00.000Z';
const daysAgo = (n: number) =>
  new Date(new Date(NOW).getTime() - n * 86_400_000).toISOString();

describe('velocity', () => {
  it('is zero with no history', () => {
    expect(velocity([], NOW)).toBe(0);
  });

  it('counts only the trailing window', () => {
    // Four mastered this month, twenty last quarter. Last quarter says nothing
    // about this week's pace.
    const recent = [daysAgo(2), daysAgo(9), daysAgo(16), daysAgo(23)];
    const ancient = Array.from({ length: 20 }, (_, i) => daysAgo(60 + i));
    expect(velocity([...recent, ...ancient], NOW)).toBeCloseTo(1, 5);
  });

  it('drops a topic the moment it leaves the window', () => {
    expect(velocity([daysAgo(VELOCITY_WINDOW_DAYS + 1)], NOW)).toBe(0);
  });
});

describe('project', () => {
  const pace = (perWeek: number) =>
    Array.from({ length: perWeek * 4 }, (_, i) => daysAgo(i + 1));

  it('gives a date and days to spare when the pace clears the target', () => {
    const p = project({ remaining: 20, masteredAt: pace(4), now: NOW, examDate: EXAM });
    expect(p.perWeek).toBeCloseTo(4, 5);
    expect(p.weeksNeeded).toBeCloseTo(5, 5);
    expect(p.date).toBeTruthy();
    expect(p.onTrack).toBe(true);
    expect(p.daysBeforeExam).toBeGreaterThan(0);
  });

  it('reports a negative margin rather than pretending', () => {
    const p = project({ remaining: 60, masteredAt: pace(1), now: NOW, examDate: EXAM });
    expect(p.onTrack).toBe(false);
    expect(p.daysBeforeExam).toBeLessThan(0);
  });

  it('refuses a date when nothing was mastered recently, and says why', () => {
    // Zero recent mastery means the pace is unknown, not zero. Projecting
    // "never" from it would be a fabricated number.
    const p = project({ remaining: 20, masteredAt: [daysAgo(200)], now: NOW, examDate: EXAM });
    expect(p.date).toBeNull();
    expect(p.onTrack).toBeNull();
    expect(p.reason).toMatch(/no pace to project from/i);
  });

  it('refuses a meaningless far-future date', () => {
    const p = project({ remaining: 500, masteredAt: [daysAgo(1)], now: NOW, examDate: EXAM });
    expect(p.date).toBeNull();
    expect(p.reason).toMatch(/over two years/);
    expect(p.onTrack).toBe(false);
  });

  it('is finished when nothing remains', () => {
    const p = project({ remaining: 0, masteredAt: [], now: NOW, examDate: EXAM });
    expect(p.weeksNeeded).toBe(0);
    expect(p.onTrack).toBe(true);
  });
});

describe('requiredPace', () => {
  it('says what pace would clear the target in time', () => {
    const need = requiredPace(34, NOW, EXAM)!;
    expect(need).toBeGreaterThan(1.5);
    expect(need).toBeLessThan(3.5);
  });

  it('is null once the exam has passed', () => {
    expect(requiredPace(10, '2027-01-01T00:00:00.000Z', EXAM)).toBeNull();
  });
});

describe('levelEstimate', () => {
  const lv = (level: LevelId, total: number, mastered: number) => ({ level, total, mastered });

  it('reads A1 from a cold start', () => {
    expect(levelEstimate([lv('A1', 15, 0), lv('A2', 15, 0)]).band).toBe('A1');
  });

  it('advances a band once its topics are essentially all mastered', () => {
    const e = levelEstimate([lv('A1', 15, 15), lv('A2', 15, 14), lv('B1', 20, 0)]);
    expect(e.band).toBe('A2');
  });

  it('marks real progress into the next band with a plus', () => {
    const e = levelEstimate([lv('A1', 15, 15), lv('A2', 15, 15), lv('B1', 20, 8)]);
    expect(e.band).toBe('A2');
    expect(e.plus).toBe(true);
  });

  it('does not award a plus for a token start on the next band', () => {
    const e = levelEstimate([lv('A1', 15, 15), lv('A2', 15, 15), lv('B1', 20, 1)]);
    expect(e.plus).toBe(false);
  });

  it('stops at the first incomplete band rather than skipping ahead', () => {
    // B2 fully mastered while B1 is half done does not make anyone B2.
    const e = levelEstimate([lv('A1', 15, 15), lv('A2', 15, 15), lv('B1', 20, 10), lv('B2', 28, 28)]);
    expect(e.band).toBe('A2');
  });
});

describe('positionOn', () => {
  it('maps a date to a fraction of the track', () => {
    expect(positionOn('2026-10-03T12:00:00.000Z', NOW, EXAM)).toBeCloseTo(0.5, 1);
  });

  it('clamps an overdue date onto the end rather than off the screen', () => {
    expect(positionOn('2027-06-01T00:00:00.000Z', NOW, EXAM)).toBe(1);
    expect(positionOn('2020-01-01T00:00:00.000Z', NOW, EXAM)).toBe(0);
  });
});

describe('errorProgress', () => {
  const base = { cleanStreak: 0, spontaneousOk: 0, consolidatingSince: null, now: NOW };

  it('is 1 only when resolved', () => {
    expect(errorProgress({ ...base, status: 'resolved' })).toBe(1);
  });

  it('never reaches 1 while the error is still live', () => {
    const p = errorProgress({
      ...base,
      status: 'consolidating',
      cleanStreak: 50,
      spontaneousOk: 9,
      consolidatingSince: daysAgo(90),
    });
    expect(p).toBeLessThan(1);
    expect(p).toBeGreaterThan(0.9);
  });

  it('caps a long clean streak at half, because §4 does not accept it alone', () => {
    const p = errorProgress({ ...base, status: 'improving', cleanStreak: 100 });
    expect(p).toBeCloseTo(0.5, 5);
  });

  it('is 0 for an untouched active error', () => {
    expect(errorProgress({ ...base, status: 'active' })).toBe(0);
  });
});

describe('spread', () => {
  it('leaves well-separated markers alone', () => {
    expect(spread([0.1, 0.5, 0.9], 0.05)).toEqual([0.1, 0.5, 0.9]);
  });

  it('pushes a cluster apart while keeping the order', () => {
    const out = spread([0.01, 0.02, 0.03], 0.05);
    // Compared with a tolerance: the values are accumulated floats, and
    // asserting exact equality would fail on 0.06000000000000001.
    expect(out[0]).toBeCloseTo(0.01, 10);
    expect(out[1]).toBeCloseTo(0.06, 10);
    expect(out[2]).toBeCloseTo(0.11, 10);
    expect([...out].sort((a, b) => a - b)).toEqual(out);
  });

  it('never runs off the end of the track', () => {
    const out = spread(Array(30).fill(0.9), 0.05);
    expect(Math.max(...out)).toBeLessThanOrEqual(1);
  });

  it('handles an empty track', () => {
    expect(spread([])).toEqual([]);
  });
});
