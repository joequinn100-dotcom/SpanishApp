import { describe, it, expect, beforeEach } from 'vitest';
import { migrate, openDatabase, type DB } from '@/db';
import type { GauntletOutcome, GenerationRequest, PanelReports } from '@/domain/gauntlet';

/**
 * Integration tests for gauntlet persistence.
 *
 * The invariant under test is the one the pure layer cannot enforce: accepted
 * content and quarantined content go to different tables, and nothing on the
 * session path can reach the second.
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

async function lib() {
  return import('./gauntlet');
}

const REQUEST: GenerationRequest = {
  topicId: 'b1.verb.imperfecto',
  level: 'B1',
  targetStructure: 'the imperfect for habitual past',
  kinds: ['drill_cloze'],
  count: 2,
  targetsError: 'verb.preterito_persona',
};

const reports: PanelReports = {
  linguistic: { pass: true, score: 9, issues: [] },
  register: { pass: true, score: 9, issues: [] },
  pedagogy: { pass: true, score: 8, issues: [] },
};

function outcome(over: Partial<GauntletOutcome> = {}): GauntletOutcome {
  return {
    outcome: 'accepted',
    score: 8.67,
    verifiedAt: '2026-08-06T09:00:00.000Z',
    rounds: [
      {
        round: 1,
        reports,
        decision: { decision: 'accept', mean: 8.67, vetoed: false, critique: [], reason: 'clean' },
      },
    ],
    items: [
      {
        kind: 'drill_cloze',
        difficulty: 2,
        payload: {
          prompt: 'Complete with the imperfect.',
          sentence: 'Antes el proveedor ___ el material los lunes.',
          answer: 'entregaba',
          explanation: 'The imperfect carries habitual past.',
        },
      },
      {
        kind: 'drill_cloze',
        difficulty: 3,
        payload: {
          prompt: 'Complete with the imperfect.',
          sentence: 'La cuadrilla ___ a las siete antes del cambio de turno.',
          answer: 'empezaba',
          explanation: 'Habitual past again, with a time expression.',
        },
      },
    ],
    ...over,
  };
}

describe('persistOutcome — accepted', () => {
  it('writes the batch into content, marked as gauntlet provenance', async () => {
    const { persistOutcome } = await lib();
    const before = (
      db.prepare('SELECT COUNT(*) AS n FROM content').get() as { n: number }
    ).n;

    const result = persistOutcome(db, REQUEST, outcome());
    expect(result).toEqual({ accepted: 2, quarantined: 0 });

    const rows = db
      .prepare(
        `SELECT provenance, gauntlet_score, verified_at, targets_error, difficulty, seed_key
           FROM content WHERE provenance = 'gauntlet'`,
      )
      .all() as {
      provenance: string;
      gauntlet_score: number;
      verified_at: string;
      targets_error: string | null;
      difficulty: number;
      seed_key: string | null;
    }[];

    expect(rows).toHaveLength(2);
    expect((db.prepare('SELECT COUNT(*) AS n FROM content').get() as { n: number }).n).toBe(
      before + 2,
    );
    for (const row of rows) {
      expect(row.provenance).toBe('gauntlet');
      expect(row.gauntlet_score).toBeCloseTo(8.67);
      expect(row.verified_at).toBe('2026-08-06T09:00:00.000Z');
      expect(row.targets_error).toBe('verb.preterito_persona');
      // Generated rows carry no seed_key — that identity belongs to authored
      // content, and a unique index would collide on the second row otherwise.
      expect(row.seed_key).toBeNull();
    }
    expect(rows.map((r) => r.difficulty).sort()).toEqual([2, 3]);
  });

  it('stores every round of the audit trail, not just the winning verdict', async () => {
    const { persistOutcome } = await lib();
    const failing: PanelReports = {
      linguistic: { pass: false, score: 4, issues: [{ severity: 'critical', quote: 'x', problem: 'wrong' }] },
      register: { pass: true, score: 7, issues: [] },
      pedagogy: { pass: true, score: 7, issues: [] },
    };
    persistOutcome(
      db,
      REQUEST,
      outcome({
        rounds: [
          {
            round: 1,
            reports: failing,
            decision: { decision: 'revise', mean: 6, vetoed: true, critique: [], reason: 'veto' },
          },
          {
            round: 2,
            reports,
            decision: { decision: 'accept', mean: 8.67, vetoed: false, critique: [], reason: 'clean' },
          },
        ],
      }),
    );

    const row = db
      .prepare("SELECT gauntlet_log FROM content WHERE provenance = 'gauntlet' LIMIT 1")
      .get() as { gauntlet_log: string };
    const log = JSON.parse(row.gauntlet_log);

    expect(log.roundsUsed).toBe(2);
    expect(log.rounds).toHaveLength(2);
    // The failed round survives, which is what makes a systematic generator
    // fault visible later rather than only its last successful cover-up.
    expect(log.rounds[0].decision.vetoed).toBe(true);
    expect(log.rounds[0].reports.linguistic.issues[0].severity).toBe('critical');
  });

  it('is one transaction — a rejected row takes the whole batch with it', async () => {
    const { persistOutcome } = await lib();
    const bad = outcome();
    // difficulty 9 violates the CHECK constraint on content.
    bad.items[1] = { ...bad.items[1], difficulty: 9 as unknown as 1 };

    expect(() => persistOutcome(db, REQUEST, bad)).toThrow();
    const n = (
      db
        .prepare("SELECT COUNT(*) AS n FROM content WHERE provenance = 'gauntlet'")
        .get() as { n: number }
    ).n;
    expect(n).toBe(0);
  });
});

describe('persistOutcome — quarantined', () => {
  it('writes to the quarantine table and never to content', async () => {
    const { persistOutcome } = await lib();
    const before = (
      db.prepare('SELECT COUNT(*) AS n FROM content').get() as { n: number }
    ).n;

    const result = persistOutcome(
      db,
      REQUEST,
      outcome({ outcome: 'quarantined', score: 5.3, reason: 'linguistic veto after 3 rounds' }),
    );
    expect(result).toEqual({ accepted: 0, quarantined: 2 });

    // Nothing reached the table sessions read from.
    expect((db.prepare('SELECT COUNT(*) AS n FROM content').get() as { n: number }).n).toBe(before);

    const rows = db
      .prepare('SELECT topic_id, rounds_used, final_score, reason FROM quarantine')
      .all() as { topic_id: string; rounds_used: number; final_score: number; reason: string }[];
    expect(rows).toHaveLength(2);
    expect(rows[0].topic_id).toBe('b1.verb.imperfecto');
    expect(rows[0].reason).toBe('linguistic veto after 3 rounds');
    expect(rows[0].final_score).toBeCloseTo(5.3);
  });

  it('quarantined content is invisible to the session planner', async () => {
    const { persistOutcome } = await lib();
    persistOutcome(db, REQUEST, outcome({ outcome: 'quarantined', reason: 'failed' }));

    const { startSession, planOf } = await import('./practice');
    const session = startSession('b1.verb.imperfecto');
    const plan = planOf(session);

    // Every planned item resolves to a live, unretired content row. The
    // quarantine table has its own id sequence, so nothing can be pulled out of
    // it into a session even by an id collision.
    expect(plan.items.length).toBeGreaterThan(0);
    const live = new Set(
      (db.prepare('SELECT id FROM content WHERE retired = 0').all() as { id: number }[]).map(
        (r) => r.id,
      ),
    );
    for (const i of plan.items) expect(live.has(i.contentId)).toBe(true);

    // And the quarantined batch really was written — this is not passing because
    // nothing was persisted.
    expect(
      (db.prepare('SELECT COUNT(*) AS n FROM quarantine').get() as { n: number }).n,
    ).toBe(2);
  });
});

describe('the content pool', () => {
  it('counts live rows and ignores retired ones', async () => {
    const { poolSize } = await lib();
    const start = poolSize(db, 'b1.verb.imperfecto');
    expect(start).toBeGreaterThan(0);

    db.prepare(
      `UPDATE content SET retired = 1
        WHERE id = (SELECT id FROM content WHERE topic_id = 'b1.verb.imperfecto' LIMIT 1)`,
    ).run();
    expect(poolSize(db, 'b1.verb.imperfecto')).toBe(start - 1);
  });

  it('reports which topics need filling, neediest first', async () => {
    const { topicsNeedingContent, poolSize } = await lib();
    const have = poolSize(db, 'b1.verb.imperfecto');
    const need = topicsNeedingContent(
      db,
      ['b1.verb.imperfecto', 'b2.mood.subj_imperfecto', 'c1.discourse.matices'],
      have + 5,
    );

    // A topic with no content at all is needier than one with a partial pool,
    // which is the order the overnight job should work in.
    expect(need[0].topicId).toBe('c1.discourse.matices');
    expect(need[0].have).toBe(0);
    expect(need.map((n) => n.need)).toEqual([...need.map((n) => n.need)].sort((a, b) => b - a));
  });

  it('returns nothing when every pool is already deep enough', async () => {
    const { topicsNeedingContent } = await lib();
    expect(topicsNeedingContent(db, ['b1.verb.imperfecto'], 1)).toEqual([]);
  });
});

describe('retireOverFamiliar', () => {
  /** Log `n` attempts against a content row, `wrong` of them incorrect. */
  function attempts(contentId: number, n: number, wrong = 0) {
    const session = db
      .prepare("INSERT INTO session (started_at, kind) VALUES ('2026-08-01T09:00:00Z', 'self_study')")
      .run();
    const insert = db.prepare(
      `INSERT INTO attempt (content_id, session_id, user_answer, correct, partial, feedback, attempted_at)
       VALUES (?, ?, 'x', ?, ?, 'f', '2026-08-01T09:00:00Z')`,
    );
    for (let i = 0; i < n; i++) {
      const correct = i < n - wrong ? 1 : 0;
      insert.run(contentId, session.lastInsertRowid, correct, correct);
    }
  }

  function firstContentId(): number {
    return (db.prepare('SELECT id FROM content LIMIT 1').get() as { id: number }).id;
  }

  it('retires an item seen six times with no misses', async () => {
    const { retireOverFamiliar } = await lib();
    const id = firstContentId();
    attempts(id, 6);

    expect(retireOverFamiliar(db)).toBe(1);
    const row = db.prepare('SELECT retired FROM content WHERE id = ?').get(id) as {
      retired: number;
    };
    expect(row.retired).toBe(1);
  });

  it('leaves an item alone below six attempts, however clean', async () => {
    const { retireOverFamiliar } = await lib();
    attempts(firstContentId(), 5);
    expect(retireOverFamiliar(db)).toBe(0);
  });

  it('never retires an item the learner still gets wrong', async () => {
    // This is the important half. An item that keeps being missed is evidence
    // the error log needs; retiring it would remove the thing measuring the gap.
    const { retireOverFamiliar } = await lib();
    attempts(firstContentId(), 20, 1);
    expect(retireOverFamiliar(db)).toBe(0);
  });

  it('is idempotent — a second run retires nothing new', async () => {
    const { retireOverFamiliar } = await lib();
    attempts(firstContentId(), 6);
    expect(retireOverFamiliar(db)).toBe(1);
    expect(retireOverFamiliar(db)).toBe(0);
  });
});

describe('the admin view', () => {
  it('lists quarantined batches newest first and summarises the reasons', async () => {
    const { persistOutcome, listQuarantined, quarantineSummary } = await lib();
    persistOutcome(
      db,
      REQUEST,
      outcome({
        outcome: 'quarantined',
        reason: 'linguistic veto after 3 rounds',
        verifiedAt: '2026-08-01T09:00:00.000Z',
      }),
    );
    persistOutcome(
      db,
      REQUEST,
      outcome({
        outcome: 'quarantined',
        reason: 'mean 6.0 < 8.0 after 3 rounds',
        verifiedAt: '2026-08-05T09:00:00.000Z',
      }),
    );

    const rows = listQuarantined(db);
    expect(rows).toHaveLength(4);
    expect(rows[0].quarantinedAt).toBe('2026-08-05T09:00:00.000Z');

    const summary = quarantineSummary(db);
    expect(summary.map((s) => s.n)).toEqual([2, 2]);
    expect(summary.map((s) => s.reason).sort()).toEqual([
      'linguistic veto after 3 rounds',
      'mean 6.0 < 8.0 after 3 rounds',
    ]);
  });
});
