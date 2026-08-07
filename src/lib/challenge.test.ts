import { describe, it, expect, beforeEach } from 'vitest';
import { migrate, openDatabase, type DB } from '@/db';
import { TOPIC } from '@/domain/mastery';
import { SPRINT } from '@/domain/challenge';

/**
 * Integration tests for SPEC §8's two challenges.
 *
 * Same harness as `practice.test.ts`: a real in-memory SQLite parked on
 * globalThis before the modules under test are imported, so the transactions,
 * foreign keys and CHECK constraints are the real ones.
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

const challenge = () => import('./challenge');
const practice = () => import('./practice');

/**
 * A topic stocked with enough drills for a boss fight.
 *
 * The seed cannot supply one: no topic has eight authored drills yet, because
 * §5's generator is what fills the pools and it has not run. That is correct
 * behaviour — `bossAvailability` says so in as many words — but it means the
 * mechanism has to be tested against drills the fixture writes itself.
 */
function stockedTopic(topicId = 'b1.verb.imperfecto', count = 14): string {
  const insert = db.prepare(
    `INSERT INTO content (topic_id, kind, difficulty, payload, targets_error,
                          gauntlet_score, gauntlet_log, verified_at)
     VALUES (?, 'drill_cloze', ?, ?, NULL, 8.5, '[]', '2026-08-01T00:00:00.000Z')`,
  );
  for (let i = 0; i < count; i++) {
    insert.run(
      topicId,
      (i % 5) + 1,
      JSON.stringify({
        prompt: 'Put the verb in the imperfect.',
        context: 'Reviewing how the site used to run.',
        sentence: `El proveedor ___ (entregar) el material la semana ${i + 1}.`,
        answer: 'entregaba',
        explanation: 'Fixture drill.',
      }),
    );
  }
  return topicId;
}

/** Put a topic exactly at the gate: reviews done, spontaneous use recorded. */
function bossUnlocked(topicId: string) {
  db.prepare(
    `UPDATE topic_state
        SET status = 'consolidating', accuracy = 0.9, attempts = 14, correct = 13,
            spontaneous = ?, reviews_passed = ?, consolidating_since = '2026-07-01T00:00:00.000Z',
            next_review_at = NULL, boss_cleared_at = NULL
      WHERE topic_id = ?`,
  ).run(TOPIC.REQUIRED_SPONTANEOUS, TOPIC.REQUIRED_REVIEWS, topicId);
}

/** Answer the open run, `rightCount` of them correctly, until it ends. */
async function playRun(sessionId: number, rightCount: number) {
  const { currentItem, submitAnswer, sessionById } = await practice();
  let right = 0;
  for (;;) {
    const s = sessionById(sessionId)!;
    if (s.ended_at) break;
    const item = currentItem(s);
    if (!item) break;
    const giveCorrect = right < rightCount;
    if (giveCorrect) right++;
    submitAnswer(sessionId, giveCorrect ? item.payload.answer : 'xxxxx no es esto xxxxx');
  }
}

describe('boss fight: the gate', () => {
  it('is refused until the reviews and the spontaneous use are in', async () => {
    const { bossAvailability, startBoss, ChallengeUnavailable } = await challenge();
    const topicId = stockedTopic();
    db.prepare("UPDATE topic_state SET status = 'consolidating' WHERE topic_id = ?").run(topicId);

    expect(bossAvailability(topicId).ready).toBe(false);
    expect(() => startBoss(topicId)).toThrow(ChallengeUnavailable);
  });

  it('is refused against a pool too thin to be honest', async () => {
    const { bossAvailability } = await challenge();
    const topicId = stockedTopic();
    bossUnlocked(topicId);
    // Retire all but a handful of the topic's drills.
    db.prepare(
      `UPDATE content SET retired = 1
        WHERE topic_id = ? AND targets_error IS NULL
          AND id NOT IN (SELECT id FROM content WHERE topic_id = ? LIMIT 3)`,
    ).run(topicId, topicId);

    const a = bossAvailability(topicId);
    expect(a.ready).toBe(false);
    expect(a.reason).toMatch(/at least/);
  });

  it('opens once the topic has earned it', async () => {
    const { bossAvailability } = await challenge();
    const topicId = stockedTopic();
    bossUnlocked(topicId);
    expect(bossAvailability(topicId)).toMatchObject({ ready: true, reason: null });
  });

  it('is refused a second time once cleared', async () => {
    const { bossAvailability } = await challenge();
    const topicId = stockedTopic();
    bossUnlocked(topicId);
    db.prepare("UPDATE topic_state SET boss_cleared_at = '2026-08-01T00:00:00.000Z' WHERE topic_id = ?")
      .run(topicId);
    expect(bossAvailability(topicId).ready).toBe(false);
  });
});

describe('boss fight: running it', () => {
  it('plans twelve items and stores them as a session', async () => {
    const { startBoss } = await challenge();
    const { sessionById, planOf } = await practice();
    const topicId = stockedTopic();
    bossUnlocked(topicId);

    const id = startBoss(topicId);
    const s = sessionById(id)!;
    expect(s.kind).toBe('boss');
    const plan = planOf(s);
    expect(plan.items).toHaveLength(TOPIC.BOSS_ITEMS);
    expect(plan.items.every((i) => i.source === 'boss' && i.topicId === topicId)).toBe(true);
  });

  it('masters the topic when it is cleared', async () => {
    const { startBoss } = await challenge();
    const topicId = stockedTopic();
    bossUnlocked(topicId);

    const id = startBoss(topicId);
    await playRun(id, TOPIC.BOSS_ITEMS);

    const st = db
      .prepare('SELECT status, boss_cleared_at, mastered_at FROM topic_state WHERE topic_id = ?')
      .get(topicId) as { status: string; boss_cleared_at: string | null; mastered_at: string | null };
    expect(st.status).toBe('mastered');
    expect(st.boss_cleared_at).toBeTruthy();
    expect(st.mastered_at).toBeTruthy();

    const a = db.prepare('SELECT passed, correct FROM boss_attempt WHERE session_id = ?').get(id) as {
      passed: number;
      correct: number;
    };
    expect(a.passed).toBe(1);
    // Won at the tenth correct answer, not the twelfth: once the verdict cannot
    // change, §8's "no retries" makes the remaining items theatre.
    expect(a.correct).toBe(TOPIC.BOSS_PASS);
  });

  it('sends the topic back to studying when it is failed', async () => {
    const { startBoss } = await challenge();
    const topicId = stockedTopic();
    bossUnlocked(topicId);

    const id = startBoss(topicId);
    await playRun(id, 0);

    const st = db
      .prepare('SELECT status, reviews_passed, boss_cleared_at FROM topic_state WHERE topic_id = ?')
      .get(topicId) as { status: string; reviews_passed: number; boss_cleared_at: string | null };
    expect(st.status).toBe('studying');
    expect(st.reviews_passed).toBe(0);
    expect(st.boss_cleared_at).toBeNull();
  });

  it('ends the run the moment the verdict is fixed — §8 gives no retries', async () => {
    const { startBoss } = await challenge();
    const { sessionById } = await practice();
    const topicId = stockedTopic();
    bossUnlocked(topicId);

    const id = startBoss(topicId);
    await playRun(id, 0);

    const s = sessionById(id)!;
    expect(s.ended_at).toBeTruthy();
    // Three wrong of twelve leaves nine possible, one short of ten.
    const n = db.prepare('SELECT count(*) AS n FROM attempt WHERE session_id = ?').get(id) as {
      n: number;
    };
    expect(n.n).toBe(TOPIC.BOSS_ITEMS - TOPIC.BOSS_PASS + 1);
  });

  it('refuses to answer a run that has ended', async () => {
    const { startBoss } = await challenge();
    const { submitAnswer } = await practice();
    const topicId = stockedTopic();
    bossUnlocked(topicId);

    const id = startBoss(topicId);
    await playRun(id, 0);
    expect(() => submitAnswer(id, 'otra vez')).toThrow(/not open/);
  });

  it('records every attempt, so four goes is visible as four goes', async () => {
    const { startBoss, bossHistory } = await challenge();
    const topicId = stockedTopic();

    for (let i = 0; i < 2; i++) {
      bossUnlocked(topicId);
      await playRun(startBoss(topicId), 0);
    }
    const history = bossHistory(topicId);
    expect(history).toHaveLength(2);
    expect(history.every((h) => h.passed === false)).toBe(true);
  });

  it('counts a walk-out as a loss', async () => {
    // §8 gives the boss fight no retries, so abandoning it cannot be free —
    // otherwise the gate is optional, and an optional gate is not a gate.
    const { startBoss, abandonChallenge } = await challenge();
    const topicId = stockedTopic();
    bossUnlocked(topicId);

    const id = startBoss(topicId);
    abandonChallenge(id);

    const st = db.prepare('SELECT status FROM topic_state WHERE topic_id = ?').get(topicId) as {
      status: string;
    };
    expect(st.status).toBe('studying');
  });
});

describe('the two challenges do not overlap with practice', () => {
  it('a practice session cannot be started while a boss fight is open', async () => {
    const { startBoss } = await challenge();
    const { startSession } = await practice();
    const topicId = stockedTopic();
    bossUnlocked(topicId);
    startBoss(topicId);

    expect(() => startSession(null)).toThrow(/boss fight/);
  });

  it('a boss fight cannot be started while a practice session is open', async () => {
    const { startBoss, ChallengeUnavailable } = await challenge();
    const { startSession } = await practice();
    const topicId = stockedTopic();
    bossUnlocked(topicId);
    startSession(null);

    expect(() => startBoss(topicId)).toThrow(ChallengeUnavailable);
  });

  it('an open boss fight is never handed back as a practice session', async () => {
    const { startBoss } = await challenge();
    const { openSession } = await practice();
    const topicId = stockedTopic();
    bossUnlocked(topicId);
    startBoss(topicId);

    expect(openSession()).toBeUndefined();
  });
});

describe('gauntlet run', () => {
  it('plans ten items drawn only from the active error list', async () => {
    const { startSprint } = await challenge();
    const { sessionById, planOf } = await practice();

    const id = startSprint();
    const plan = planOf(sessionById(id)!);
    expect(plan.items).toHaveLength(SPRINT.ITEMS);
    expect(plan.items.every((i) => i.source === 'sprint')).toBe(true);
    expect(plan.items.every((i) => i.errorCode !== null)).toBe(true);

    const codes = plan.items.map((i) => i.errorCode!);
    const resolved = db
      .prepare(`SELECT count(*) AS n FROM error WHERE status = 'resolved' AND code IN (${codes.map(() => '?').join(',')})`)
      .get(...codes) as { n: number };
    expect(resolved.n).toBe(0);
  });

  it('ends on the third life lost, part-way through', async () => {
    const { startSprint } = await challenge();
    const { sessionById } = await practice();

    const id = startSprint();
    await playRun(id, 0);

    const run = db
      .prepare('SELECT outcome, lives_left AS livesLeft, duration_ms AS durationMs FROM sprint_run WHERE session_id = ?')
      .get(id) as { outcome: string; livesLeft: number; durationMs: number };
    expect(run.outcome).toBe('out_of_lives');
    expect(run.livesLeft).toBe(0);
    expect(run.durationMs).toBeGreaterThanOrEqual(0);
    expect(sessionById(id)!.ended_at).toBeTruthy();

    const n = db.prepare('SELECT count(*) AS n FROM attempt WHERE session_id = ?').get(id) as { n: number };
    expect(n.n).toBe(SPRINT.LIVES);
  });

  it('clears on ten answers and lands on the leaderboard', async () => {
    const { startSprint, sprintBoard, sprintPersonalBest } = await challenge();

    const id = startSprint();
    await playRun(id, SPRINT.ITEMS);

    const run = db.prepare('SELECT outcome, correct FROM sprint_run WHERE session_id = ?').get(id) as {
      outcome: string;
      correct: number;
    };
    expect(run.outcome).toBe('cleared');
    expect(run.correct).toBe(SPRINT.ITEMS);

    expect(sprintBoard().map((r) => r.id)).toEqual([id]);
    expect(sprintPersonalBest()!.id).toBe(id);
  });

  it('keeps a lost run out of the leaderboard but in the history', async () => {
    const { startSprint, sprintBoard, finishedSprints } = await challenge();
    await playRun(startSprint(), 0);

    expect(sprintBoard()).toEqual([]);
    expect(finishedSprints()).toHaveLength(1);
  });

  it('drives error extinction — a sprint answer moves the error state', async () => {
    // This is the reason the Gauntlet Run is a session rather than a
    // side-channel: §8 weights the whole game toward error extinction, and a
    // parallel attempt path would have been the first thing to stop doing it.
    const { startSprint } = await challenge();
    const { currentItem, submitAnswer, sessionById } = await practice();

    const id = startSprint();
    const item = currentItem(sessionById(id)!)!;
    const before = db
      .prepare('SELECT clean_streak AS n FROM error WHERE code = ?')
      .get(item.errorCode!) as { n: number };

    submitAnswer(id, item.payload.answer);

    const after = db
      .prepare('SELECT clean_streak AS n FROM error WHERE code = ?')
      .get(item.errorCode!) as { n: number };
    expect(after.n).toBe(before.n + 1);
  });

  it('records an abandoned run as abandoned', async () => {
    const { startSprint, abandonChallenge, sprintBoard, finishedSprints } = await challenge();
    const id = startSprint();
    abandonChallenge(id);

    expect(finishedSprints()[0].outcome).toBe('abandoned');
    expect(sprintBoard()).toEqual([]);
  });
});
