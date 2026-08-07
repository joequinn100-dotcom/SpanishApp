import { describe, it, expect, beforeEach, vi } from 'vitest';
import { migrate, openDatabase, type DB } from '@/db';
import type { DraftItem, GauntletClient, VerifierReport } from '@/domain/gauntlet';

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
  vi.restoreAllMocks();
});

const lib = () => import('./pregenerate');

const NOW = () => new Date('2026-08-07T03:00:00.000Z');

function items(n: number): DraftItem[] {
  return Array.from({ length: n }, (_, i) => ({
    kind: 'drill_cloze' as const,
    difficulty: ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5,
    payload: {
      prompt: 'Fill the gap.',
      context: 'On site.',
      sentence: `La cuadrilla ___ el andamio (montar) — ${i}.`,
      answer: 'montaba',
      explanation: 'Fixture.',
    },
  }));
}

function report(score: number): VerifierReport {
  return { score, pass: score >= 8, issues: [] };
}

/** A client whose panel always accepts. */
function acceptingClient(): GauntletClient {
  return {
    generate: vi.fn(async (req) => items(req.count)),
    verify: vi.fn(async () => report(9)),
    revise: vi.fn(async (_req, current) => current),
  };
}

/** A client whose linguistic verifier never passes — three rounds, quarantine. */
function failingClient(): GauntletClient {
  return {
    generate: vi.fn(async (req) => items(req.count)),
    verify: vi.fn(async (id) => (id === 'linguistic' ? report(4) : report(9))),
    revise: vi.fn(async (_req, current) => current),
  };
}

describe('planning the run', () => {
  it('takes the next recommended topics, in recommendation order', async () => {
    const { pregenerationPlan } = await lib();
    const plan = pregenerationPlan(db, 3);
    expect(plan).toHaveLength(3);

    const { nextUp } = await import('./progress');
    const recommended = nextUp(30).map((t) => t.id);
    // Every planned topic is recommended, and their relative order is kept.
    const positions = plan.map((p) => recommended.indexOf(p.topicId));
    expect(positions.every((i) => i >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it('skips topics whose pool is already deep enough', async () => {
    const { pregenerationPlan, POOL_TARGET } = await lib();
    const first = pregenerationPlan(db, 3)[0];

    const insert = db.prepare(
      `INSERT INTO content (topic_id, kind, difficulty, payload, gauntlet_score,
                            gauntlet_log, verified_at)
       VALUES (?, 'drill_cloze', 2, '{}', 8.5, '[]', '2026-08-01T00:00:00.000Z')`,
    );
    for (let i = 0; i < POOL_TARGET; i++) insert.run(first.topicId);

    expect(pregenerationPlan(db, 3).map((p) => p.topicId)).not.toContain(first.topicId);
  });

  it('never plans a topic the app will not recommend (§10 no_schedule)', async () => {
    const { pregenerationPlan } = await lib();
    const excluded = db.prepare('SELECT id FROM topic WHERE no_schedule = 1').all() as {
      id: string;
    }[];
    expect(excluded.length).toBeGreaterThan(0);
    const planned = pregenerationPlan(db, 50).map((p) => p.topicId);
    for (const e of excluded) expect(planned).not.toContain(e.id);
  });

  it('does not count retired drills as pool depth', async () => {
    const { pregenerationPlan, POOL_TARGET } = await lib();
    const first = pregenerationPlan(db, 1)[0];
    const insert = db.prepare(
      `INSERT INTO content (topic_id, kind, difficulty, payload, gauntlet_score,
                            gauntlet_log, verified_at, retired)
       VALUES (?, 'drill_cloze', 2, '{}', 8.5, '[]', '2026-08-01T00:00:00.000Z', 1)`,
    );
    for (let i = 0; i < POOL_TARGET * 2; i++) insert.run(first.topicId);

    expect(pregenerationPlan(db, 1)[0].topicId).toBe(first.topicId);
  });
});

describe('running the job', () => {
  it('writes accepted content and records the run', async () => {
    const { pregenerate, recentPregenRuns } = await lib();
    const client = acceptingClient();

    const r = await pregenerate(db, { client, now: NOW }, { limit: 2 });

    expect(r.outcome).toBe('ok');
    expect(r.accepted).toBeGreaterThan(0);
    expect(r.quarantined).toBe(0);
    expect(r.batches).toBe(2);

    const written = db
      .prepare("SELECT count(*) AS n FROM content WHERE provenance = 'gauntlet'")
      .get() as { n: number };
    expect(written.n).toBe(r.accepted);

    const [run] = recentPregenRuns(db);
    expect(run.outcome).toBe('ok');
    expect(run.accepted).toBe(r.accepted);
    expect(run.endedAt).toBeTruthy();
    expect(run.topics).toHaveLength(2);
  });

  it('never lets quarantined content reach the content table', async () => {
    const { pregenerate } = await lib();
    const r = await pregenerate(db, { client: failingClient(), now: NOW }, { limit: 1 });

    expect(r.quarantined).toBeGreaterThan(0);
    expect(r.accepted).toBe(0);
    const live = db
      .prepare("SELECT count(*) AS n FROM content WHERE provenance = 'gauntlet'")
      .get() as { n: number };
    expect(live.n).toBe(0);
    const held = db.prepare('SELECT count(*) AS n FROM quarantine').get() as { n: number };
    expect(held.n).toBe(r.quarantined);
  });

  it('keeps the batches it verified when a later topic fails', async () => {
    // Gauntlet-verified content is expensive and §5 says cache it forever.
    // Discarding a good batch because an unrelated later call failed is the
    // one unforced error this job can make.
    const { pregenerate } = await lib();
    let call = 0;
    const client: GauntletClient = {
      generate: vi.fn(async (req) => {
        if (++call > 1) throw new Error('rate limited');
        return items(req.count);
      }),
      verify: vi.fn(async () => report(9)),
      revise: vi.fn(async (_r, current) => current),
    };

    const r = await pregenerate(db, { client, now: NOW }, { limit: 3 });

    expect(r.accepted).toBeGreaterThan(0);
    expect(r.perTopic.filter((p) => p.error !== null).length).toBe(2);
    expect(r.outcome).toBe('ok'); // partial success is not failure
    const live = db.prepare('SELECT count(*) AS n FROM content').get() as { n: number };
    expect(live.n).toBeGreaterThan(0);
  });

  it('stops the whole run on a missing API key rather than repeating itself', async () => {
    const { pregenerate } = await lib();
    const err = new Error('ANTHROPIC_API_KEY is not set.');
    err.name = 'MissingApiKeyError';
    const client: GauntletClient = {
      generate: vi.fn(async () => {
        throw err;
      }),
      verify: vi.fn(async () => report(9)),
      revise: vi.fn(async (_r, current) => current),
    };

    const r = await pregenerate(db, { client, now: NOW }, { limit: 3 });

    expect(r.outcome).toBe('no_api_key');
    expect(r.perTopic).toHaveLength(1); // not three copies of the same message
    expect(client.generate).toHaveBeenCalledTimes(1);
  });

  it('reports failure when every topic failed', async () => {
    const { pregenerate } = await lib();
    const client: GauntletClient = {
      generate: vi.fn(async () => {
        throw new Error('upstream is down');
      }),
      verify: vi.fn(async () => report(9)),
      revise: vi.fn(async (_r, current) => current),
    };

    const r = await pregenerate(db, { client, now: NOW }, { limit: 2 });
    expect(r.outcome).toBe('failed');
    expect(r.error).toMatch(/upstream/);
  });

  it('records a run with nothing to do rather than staying silent', async () => {
    // A job whose failure mode is silence is a job nobody notices has stopped.
    const { pregenerate, recentPregenRuns } = await lib();
    const client = acceptingClient();

    const r = await pregenerate(db, { client, now: NOW }, { limit: 0 });
    expect(r.outcome).toBe('nothing_to_do');
    expect(client.generate).not.toHaveBeenCalled();
    expect(recentPregenRuns(db)[0].outcome).toBe('nothing_to_do');
  });

  it('caps the API calls one run can make', async () => {
    const { pregenerate } = await lib();
    const client = acceptingClient();
    await pregenerate(db, { client, now: NOW }, { limit: 3, maxBatches: 1 });
    expect(client.generate).toHaveBeenCalledTimes(1);
  });

  it('asks for at most one batch of ten per topic', async () => {
    // §5 prices a gauntlet run at five API calls. Emptying a 14-item hole in
    // one night across three topics would be thirty calls; the pool fills over
    // a few nights instead, and no single run surprises anyone with its bill.
    const { pregenerate, BATCH_SIZE } = await lib();
    const client = acceptingClient();
    await pregenerate(db, { client, now: NOW }, { limit: 3 });

    const generate = client.generate as unknown as { mock: { calls: [{ count: number }][] } };
    for (const [req] of generate.mock.calls) {
      expect(req.count).toBeLessThanOrEqual(BATCH_SIZE);
    }
  });

  it('retires over-familiar drills before measuring the pool', async () => {
    // Otherwise a topic looks stocked with material the learner has memorised.
    const { pregenerate } = await lib();
    const { FAMILIARITY_ATTEMPTS } = await import('./gauntlet');

    const topicId = db.prepare('SELECT topic_id AS id FROM content LIMIT 1').get() as { id: string };
    const contentId = db.prepare('SELECT id FROM content WHERE topic_id = ? LIMIT 1').get(topicId.id) as {
      id: number;
    };
    const s = db
      .prepare("INSERT INTO session (started_at, kind) VALUES ('2026-08-01T09:00:00Z','self_study')")
      .run();
    const insert = db.prepare(
      `INSERT INTO attempt (content_id, session_id, user_answer, correct, feedback, attempted_at)
       VALUES (?, ?, 'x', 1, 'ok', '2026-08-01T09:00:00Z')`,
    );
    for (let i = 0; i < FAMILIARITY_ATTEMPTS; i++) insert.run(contentId.id, s.lastInsertRowid);

    await pregenerate(db, { client: acceptingClient(), now: NOW }, { limit: 0 });

    const row = db.prepare('SELECT retired FROM content WHERE id = ?').get(contentId.id) as {
      retired: number;
    };
    expect(row.retired).toBe(1);
  });
});
