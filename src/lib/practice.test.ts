import { describe, it, expect, beforeEach } from 'vitest';
import { migrate, openDatabase, type DB } from '@/db';

/**
 * Integration tests for the practice loop.
 *
 * `getDb()` parks its connection on globalThis, so pointing that at an
 * in-memory database before importing the modules under test gives a real
 * SQLite instance — real transactions, real foreign keys, real CHECK
 * constraints — without touching ./data.
 */
function freshDb(): DB {
  const db = openDatabase(':memory:');
  migrate(db);
  globalThis.__fluencia_db = db;
  return db;
}

let db: DB;

beforeEach(async () => {
  db = freshDb();
  const { seed } = await import('@/seed');
  seed(db);
});

async function practice() {
  return import('./practice');
}

describe('session lifecycle', () => {
  it('plans a warm-up before topic work and stores the plan on the row', async () => {
    const { startSession, planOf } = await practice();
    const s = startSession('b1.verb.imperfecto');

    const plan = planOf(s);
    expect(plan.items.length).toBeGreaterThan(6);
    expect(plan.items[0].source).toBe('warmup');
    expect(plan.items.some((i) => i.source === 'topic')).toBe(true);
    expect(s.cursor).toBe(0);
  });

  it('resumes rather than starting a second session', async () => {
    const { startSession } = await practice();
    const first = startSession('b1.verb.imperfecto');
    const second = startSession('b1.mood.subj_presente');
    expect(second.id).toBe(first.id);

    const n = db.prepare('SELECT count(*) AS n FROM session').get() as { n: number };
    expect(n.n).toBe(1);
  });

  it('serves the item the stored cursor points at, not one held in memory', async () => {
    const { startSession, currentItem, sessionById } = await practice();
    const s = startSession('b1.verb.imperfecto');

    const first = currentItem(s)!;
    db.prepare('UPDATE session SET cursor = 3 WHERE id = ?').run(s.id);
    const later = currentItem(sessionById(s.id)!)!;

    expect(later.index).toBe(3);
    expect(later.contentId).not.toBe(first.contentId);
  });
});

describe('answering', () => {
  it('records an attempt and advances the cursor together', async () => {
    const { startSession, currentItem, submitAnswer, sessionById } = await practice();
    const s = startSession('b1.verb.imperfecto');
    const item = currentItem(s)!;

    submitAnswer(s.id, item.payload.answer);

    const after = sessionById(s.id)!;
    expect(after.cursor).toBe(1);
    const attempts = db.prepare('SELECT * FROM attempt WHERE session_id = ?').all(s.id);
    expect(attempts).toHaveLength(1);
  });

  it('grades a correct answer as correct and awards XP', async () => {
    const { startSession, currentItem, submitAnswer, XP } = await practice();
    const s = startSession('b1.verb.imperfecto');
    const item = currentItem(s)!;

    const r = submitAnswer(s.id, item.payload.answer);
    expect(r.correct).toBe(true);
    expect(r.xp).toBeGreaterThanOrEqual(XP.CORRECT_DRILL);
  });

  it('logs an error_event for a warm-up item and moves the error state', async () => {
    const { startSession, currentItem, submitAnswer } = await practice();
    const s = startSession(null);
    const item = currentItem(s)!;
    expect(item.errorCode).not.toBeNull();

    const before = db
      .prepare('SELECT clean_streak FROM error WHERE code = ?')
      .get(item.errorCode) as { clean_streak: number };

    submitAnswer(s.id, item.payload.answer);

    const events = db
      .prepare(
        `SELECT ev.outcome FROM error_event ev JOIN error e ON e.id = ev.error_id
          WHERE e.code = ? AND ev.session_id = ?`,
      )
      .all(item.errorCode, s.id) as { outcome: string }[];
    expect(events).toEqual([{ outcome: 'avoided' }]);

    const after = db
      .prepare('SELECT clean_streak FROM error WHERE code = ?')
      .get(item.errorCode) as { clean_streak: number };
    expect(after.clean_streak).toBe(before.clean_streak + 1);
  });

  it('records a committed error and resets the streak when the answer is wrong', async () => {
    const { startSession, currentItem, submitAnswer } = await practice();
    const s = startSession(null);
    const item = currentItem(s)!;
    db.prepare('UPDATE error SET clean_streak = 4 WHERE code = ?').run(item.errorCode);

    const r = submitAnswer(s.id, 'xxxxx');
    expect(r.correct).toBe(false);

    const after = db
      .prepare('SELECT clean_streak, occurrences FROM error WHERE code = ?')
      .get(item.errorCode) as { clean_streak: number; occurrences: number };
    expect(after.clean_streak).toBe(0);
  });

  it('moves a topic from available to studying on the first attempt', async () => {
    const { startSession, currentItem, submitAnswer } = await practice();
    db.prepare("UPDATE topic_state SET status = 'available' WHERE topic_id = 'b1.verb.imperfecto'").run();
    const s = startSession('b1.verb.imperfecto');

    // Walk to the first item belonging to the focus topic.
    let item = currentItem(s)!;
    while (item.topicId !== 'b1.verb.imperfecto') {
      submitAnswer(s.id, item.payload.answer);
      const { sessionById } = await practice();
      item = currentItem(sessionById(s.id)!)!;
    }
    submitAnswer(s.id, item.payload.answer);

    const st = db
      .prepare("SELECT status FROM topic_state WHERE topic_id = 'b1.verb.imperfecto'")
      .get() as { status: string };
    expect(st.status).toBe('studying');
  });

  it('stores accuracy from the attempt window, matching what the partials say', async () => {
    // The window semantics are unit-tested in grading.test.ts. What this checks
    // is the wiring: that the number written to topic_state is the mean of the
    // recorded partials for that topic, and not correct/attempts.
    const { startSession, currentItem, submitAnswer, sessionById } = await practice();
    const s = startSession('b1.verb.imperfecto');

    const plan = JSON.parse(sessionById(s.id)!.plan_json!) as { items: unknown[] };
    for (let i = 0; i < plan.items.length; i++) {
      const item = currentItem(sessionById(s.id)!)!;
      // Alternate, so no topic ends up all-right or all-wrong by accident.
      submitAnswer(s.id, i % 2 === 0 ? item.payload.answer : 'zzz');
    }

    const rows = db
      .prepare('SELECT topic_id, accuracy, attempts FROM topic_state WHERE attempts > 0')
      .all() as { topic_id: string; accuracy: number; attempts: number }[];
    expect(rows.length).toBeGreaterThan(0);

    for (const r of rows) {
      const partials = (
        db
          .prepare(
            `SELECT a.partial FROM attempt a JOIN content c ON c.id = a.content_id
              WHERE c.topic_id = ? ORDER BY a.id DESC LIMIT 20`,
          )
          .all(r.topic_id) as { partial: number }[]
      ).map((x) => x.partial);
      const expected = partials.reduce((a, b) => a + b, 0) / partials.length;
      expect(r.accuracy, r.topic_id).toBeCloseTo(expected, 6);
    }
  });

  it('refuses to answer a session that has ended', async () => {
    const { startSession, submitAnswer } = await practice();
    const { finishSession } = await import('./handoff');
    const s = startSession(null);
    finishSession(s.id);
    expect(() => submitAnswer(s.id, 'algo')).toThrow(/not open/);
  });

  it('rolls the whole answer back if any part of it fails', async () => {
    const { startSession, submitAnswer } = await practice();
    const s = startSession(null);
    // Cursor past the end: currentItem returns null and submitAnswer throws
    // before writing anything.
    db.prepare('UPDATE session SET cursor = 999 WHERE id = ?').run(s.id);
    expect(() => submitAnswer(s.id, 'algo')).toThrow();
    const n = db.prepare('SELECT count(*) AS n FROM attempt').get() as { n: number };
    expect(n.n).toBe(0);
  });
});

describe('streak', () => {
  it('starts at 1 on the first session', async () => {
    const { startSession, streak } = await practice();
    startSession(null);
    expect(streak().current).toBe(1);
  });

  it('does not double-count two sessions on the same day', async () => {
    const { startSession, streak, touchStreak } = await practice();
    startSession(null);
    touchStreak(new Date().toISOString());
    expect(streak().current).toBe(1);
  });

  it('increments when the previous activity was yesterday', async () => {
    const { touchStreak, streak } = await practice();
    const yesterday = new Date(Date.now() - 86_400_000).toISOString();
    touchStreak(yesterday);
    touchStreak(new Date().toISOString());
    expect(streak().current).toBe(2);
  });

  it('resets after a gap', async () => {
    const { touchStreak, streak } = await practice();
    touchStreak(new Date(Date.now() - 5 * 86_400_000).toISOString());
    touchStreak(new Date().toISOString());
    expect(streak().current).toBe(1);
    expect(streak().longest).toBe(1);
  });
});

describe('handoff (SPEC §7)', () => {
  it('reports what was worked on and what the errors did', async () => {
    const { startSession, currentItem, submitAnswer, sessionById } = await practice();
    const { finishSession } = await import('./handoff');

    const s = startSession('b1.verb.imperfecto');
    for (let i = 0; i < 4; i++) {
      const item = currentItem(sessionById(s.id)!)!;
      submitAnswer(s.id, i === 0 ? 'respuesta equivocada' : item.payload.answer);
    }

    const h = finishSession(s.id);
    expect(h.version).toBe(2);
    expect(h.session_id).toBe(s.id);
    expect(h.worked_on.length).toBeGreaterThan(0);
    expect(h.errors_committed.length + h.errors_avoided.length).toBeGreaterThan(0);
    expect(h.resume_prompt).toMatch(/error log/);
  });

  it('is written onto the session row so it survives a restart', async () => {
    const { startSession } = await practice();
    const { finishSession, latestHandoff } = await import('./handoff');
    const s = startSession(null);
    finishSession(s.id);

    const row = db
      .prepare('SELECT ended_at, handoff_json, handoff_md FROM session WHERE id = ?')
      .get(s.id) as { ended_at: string; handoff_json: string; handoff_md: string };
    expect(row.ended_at).toBeTruthy();
    expect(JSON.parse(row.handoff_json).version).toBe(2);
    expect(row.handoff_md).toContain('## Worked on');

    expect(latestHandoff()?.sessionId).toBe(s.id);
  });

  it('is idempotent — ending twice does not rewrite it', async () => {
    const { startSession } = await practice();
    const { finishSession } = await import('./handoff');
    const s = startSession(null);
    const first = finishSession(s.id);
    const second = finishSession(s.id);
    expect(second.ended_at).toBe(first.ended_at);
  });

  it('renders markdown with every section the spec names', async () => {
    const { startSession } = await practice();
    const { finishSession, handoffMarkdown } = await import('./handoff');
    const s = startSession(null);
    const md = handoffMarkdown(finishSession(s.id));
    for (const heading of ['## Worked on', '## Errors committed', '## Errors avoided', '## Next']) {
      expect(md).toContain(heading);
    }
  });
});

describe('spaced reviews — the consolidating → mastered gate', () => {
  /** Put a topic into consolidation with a review already due. */
  function consolidate(topicId: string, opts: { spontaneous?: number; reviewsPassed?: number } = {}) {
    db.prepare(
      `UPDATE topic_state
          SET status = 'consolidating', accuracy = 0.9, attempts = 14, correct = 13,
              spontaneous = ?, reviews_passed = ?, consolidating_since = ?, next_review_at = ?
        WHERE topic_id = ?`,
    ).run(
      opts.spontaneous ?? 0,
      opts.reviewsPassed ?? 0,
      '2026-07-01T00:00:00.000Z',
      '2026-07-04T00:00:00.000Z',
      topicId,
    );
  }

  /** Answer every review item in the open session, right or wrong. */
  async function answerReviewBlock(sessionId: number, correct: boolean) {
    const { currentItem, submitAnswer, sessionById, planOf } = await practice();
    const plan = planOf(sessionById(sessionId)!);
    for (let i = 0; i < plan.items.length; i++) {
      const item = currentItem(sessionById(sessionId)!)!;
      const isReview = plan.items[item.index].source === 'review';
      submitAnswer(sessionId, isReview && !correct ? 'respuesta equivocada' : item.payload.answer);
    }
  }

  it('finds a topic whose review has come due', async () => {
    const { dueReviews, dueReviewCount } = await practice();
    expect(dueReviews()).toEqual([]);
    consolidate('b1.verb.imperfecto');
    expect(dueReviews().map((d) => d.topicId)).toEqual(['b1.verb.imperfecto']);
    expect(dueReviewCount()).toBe(1);
  });

  it('does not serve a review before it is due', async () => {
    const { dueReviews } = await practice();
    consolidate('b1.verb.imperfecto');
    db.prepare("UPDATE topic_state SET next_review_at = '2099-01-01T00:00:00.000Z' WHERE topic_id = ?")
      .run('b1.verb.imperfecto');
    expect(dueReviews()).toEqual([]);
  });

  it('plans the review into the session', async () => {
    const { startSession, planOf } = await practice();
    consolidate('b1.verb.imperfecto');
    const plan = planOf(startSession('b1.mood.subj_presente'));
    expect(plan.reviewTopics).toEqual(['b1.verb.imperfecto']);
    expect(plan.items.some((i) => i.source === 'review')).toBe(true);
  });

  it('a clean review advances the count without mastering, when spontaneous evidence is missing', async () => {
    // §4's gate is two clean reviews AND at least one spontaneous correct use.
    // Passing reviews alone must not be enough — that is the whole point of the
    // rule, and the easiest place to get it wrong.
    const { startSession } = await practice();
    consolidate('b1.verb.imperfecto', { spontaneous: 0 });
    const s = startSession(null);
    await answerReviewBlock(s.id, true);

    const st = db
      .prepare('SELECT status, reviews_passed FROM topic_state WHERE topic_id = ?')
      .get('b1.verb.imperfecto') as { status: string; reviews_passed: number };
    expect(st.reviews_passed).toBe(1);
    expect(st.status).toBe('consolidating');
  });

  it('masters the topic on the second clean review once spontaneous evidence exists', async () => {
    const { startSession } = await practice();
    consolidate('b1.verb.imperfecto', { spontaneous: 1, reviewsPassed: 1 });
    const s = startSession(null);
    await answerReviewBlock(s.id, true);

    const st = db
      .prepare('SELECT status, reviews_passed, mastered_at FROM topic_state WHERE topic_id = ?')
      .get('b1.verb.imperfecto') as { status: string; reviews_passed: number; mastered_at: string };
    expect(st.status).toBe('mastered');
    expect(st.reviews_passed).toBe(2);
    expect(st.mastered_at).toBeTruthy();
  });

  it('an unclean review restarts the sequence rather than pausing it', async () => {
    const { startSession } = await practice();
    consolidate('b1.verb.imperfecto', { spontaneous: 1, reviewsPassed: 1 });
    const s = startSession(null);
    await answerReviewBlock(s.id, false);

    const st = db
      .prepare('SELECT status, reviews_passed, next_review_at FROM topic_state WHERE topic_id = ?')
      .get('b1.verb.imperfecto') as {
      status: string;
      reviews_passed: number;
      next_review_at: string;
    };
    expect(st.reviews_passed).toBe(0);
    expect(st.status).toBe('consolidating');
    expect(st.next_review_at).toBeTruthy();
  });

  it('schedules the next review 3 days out after the first, 10 after the second', async () => {
    const { startSession } = await practice();
    consolidate('b1.verb.imperfecto', { spontaneous: 0 });
    const s = startSession(null);
    await answerReviewBlock(s.id, true);

    const st = db
      .prepare('SELECT next_review_at FROM topic_state WHERE topic_id = ?')
      .get('b1.verb.imperfecto') as { next_review_at: string };
    const days = (new Date(st.next_review_at).getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(9);
    expect(days).toBeLessThan(11);
  });

  it('does not judge the review until every item in the block is answered', async () => {
    const { startSession, currentItem, sessionById, submitAnswer, planOf } = await practice();
    consolidate('b1.verb.imperfecto', { spontaneous: 1, reviewsPassed: 1 });
    const s = startSession(null);
    const plan = planOf(sessionById(s.id)!);
    const firstReview = plan.items.findIndex((i) => i.source === 'review');

    // Answer everything up to and including the first review item only.
    for (let i = 0; i <= firstReview; i++) {
      const item = currentItem(sessionById(s.id)!)!;
      submitAnswer(s.id, item.payload.answer);
    }

    const st = db
      .prepare('SELECT status, reviews_passed FROM topic_state WHERE topic_id = ?')
      .get('b1.verb.imperfecto') as { status: string; reviews_passed: number };
    expect(st.status).toBe('consolidating');
    expect(st.reviews_passed).toBe(1);
  });
});
