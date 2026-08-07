import { describe, it, expect, beforeEach } from 'vitest';
import { migrate, openDatabase, type DB } from '@/db';

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

const mod = () => import('./transcripts');

const CLASS = `Lorena: Buenos días, ¿cómo va la obra?
Joe: Tenemos una problema con la programa de entregas.
Lorena: Es "un problema", masculino.
Joe: Después la reunión enviamos el acta a todos.
Joe: Si tuviéramos más plazo, reforzaríamos la cimentación.
Lorena: Muy bien, ese condicional está perfecto.`;

async function ingestClass() {
  const { ingest } = await mod();
  return ingest({ raw: CLASS, learner: 'Joe', source: 'lorena', classDate: '2026-08-05' });
}

describe('ingest', () => {
  it('stores only the learner’s turns', async () => {
    const r = await ingestClass();
    const t = db.prepare('SELECT learner_text FROM transcript WHERE id = ?').get(r.transcriptId) as {
      learner_text: string;
    };
    expect(t.learner_text).toContain('Tenemos una problema');
    expect(t.learner_text).not.toContain('masculino');
    expect(t.learner_text).not.toContain('Buenos días');
  });

  it('proposes both errors and positives', async () => {
    const r = await ingestClass();
    expect(r.errors).toBeGreaterThan(0);
    expect(r.positives).toBeGreaterThan(0);
  });

  it('writes every finding as pending and nothing else', async () => {
    // The invariant from CLAUDE.md, tested rather than trusted.
    const before = db.prepare('SELECT code, status, occurrences FROM error ORDER BY code').all();
    await ingestClass();
    const after = db.prepare('SELECT code, status, occurrences FROM error ORDER BY code').all();
    expect(after).toEqual(before);

    const events = db.prepare('SELECT count(*) AS n FROM error_event').get() as { n: number };
    expect(events.n).toBe(0);

    const pending = db
      .prepare("SELECT count(*) AS n FROM transcript_finding WHERE decision <> 'pending'")
      .get() as { n: number };
    expect(pending.n).toBe(0);
  });

  it('records how much Spanish the learner actually produced', async () => {
    const r = await ingestClass();
    expect(r.learnerWords).toBeGreaterThan(10);
  });

  it('finds nothing to score when the learner is misidentified', async () => {
    // Picking the teacher yields her turns — which are correct — so no errors.
    // The danger this guards against is the opposite default: analysing
    // everything and logging her Spanish as yours.
    const { ingest } = await mod();
    const r = ingest({ raw: CLASS, learner: 'Lorena', source: 'lorena', classDate: '2026-08-05' });
    const t = db.prepare('SELECT learner_text FROM transcript WHERE id = ?').get(r.transcriptId) as {
      learner_text: string;
    };
    expect(t.learner_text).not.toContain('Tenemos una problema');
  });
});

describe('decide', () => {
  async function firstErrorFinding() {
    const r = await ingestClass();
    const { findingsFor } = await mod();
    const f = findingsFor(r.transcriptId).find((x) => x.kind === 'error' && x.error_code)!;
    return { r, f };
  }

  it('accept logs a committed event and advances the error', async () => {
    const { decide } = await mod();
    const { f } = await firstErrorFinding();
    const before = db
      .prepare('SELECT occurrences, clean_streak FROM error WHERE code = ?')
      .get(f.error_code) as { occurrences: number; clean_streak: number };

    decide(f.id, 'accepted');

    const after = db
      .prepare('SELECT occurrences, clean_streak FROM error WHERE code = ?')
      .get(f.error_code) as { occurrences: number; clean_streak: number };
    expect(after.occurrences).toBe(before.occurrences + 1);
    expect(after.clean_streak).toBe(0);

    const ev = db
      .prepare(
        `SELECT ev.outcome, ev.source FROM error_event ev JOIN error e ON e.id = ev.error_id
          WHERE e.code = ?`,
      )
      .all(f.error_code) as { outcome: string; source: string }[];
    expect(ev).toEqual([{ outcome: 'committed', source: 'transcript' }]);
  });

  it('one-off records the event but leaves the error state alone', async () => {
    // This is the button that stops a bad day from poisoning the log.
    const { decide } = await mod();
    const { f } = await firstErrorFinding();
    const before = db
      .prepare('SELECT status, occurrences, clean_streak FROM error WHERE code = ?')
      .get(f.error_code);

    decide(f.id, 'one_off');

    const after = db
      .prepare('SELECT status, occurrences, clean_streak FROM error WHERE code = ?')
      .get(f.error_code);
    expect(after).toEqual(before);

    const ev = db.prepare('SELECT count(*) AS n FROM error_event').get() as { n: number };
    expect(ev.n).toBe(1);
  });

  it('reject leaves no trace at all', async () => {
    const { decide } = await mod();
    const { f } = await firstErrorFinding();
    const before = db.prepare('SELECT * FROM error WHERE code = ?').get(f.error_code);

    decide(f.id, 'rejected');

    expect(db.prepare('SELECT * FROM error WHERE code = ?').get(f.error_code)).toEqual(before);
    const ev = db.prepare('SELECT count(*) AS n FROM error_event').get() as { n: number };
    expect(ev.n).toBe(0);
  });

  it('accepting a positive logs spontaneous evidence — §4’s resolution requirement', async () => {
    const { decide, findingsFor } = await mod();
    const r = await ingestClass();
    const pos = findingsFor(r.transcriptId).find((x) => x.kind === 'positive' && x.topic_id)!;

    const before = db
      .prepare('SELECT spontaneous FROM topic_state WHERE topic_id = ?')
      .get(pos.topic_id) as { spontaneous: number };

    decide(pos.id, 'accepted');

    const after = db
      .prepare('SELECT spontaneous FROM topic_state WHERE topic_id = ?')
      .get(pos.topic_id) as { spontaneous: number };
    expect(after.spontaneous).toBe(before.spontaneous + 1);
  });

  it('accepting a positive bumps the linked error’s clean streak and spontaneous count', async () => {
    const { decide, findingsFor } = await mod();
    const r = await ingestClass();
    const pos = findingsFor(r.transcriptId).find((x) => x.kind === 'positive' && x.error_code)!;

    const before = db
      .prepare('SELECT clean_streak, spontaneous_ok FROM error WHERE code = ?')
      .get(pos.error_code) as { clean_streak: number; spontaneous_ok: number };

    decide(pos.id, 'accepted');

    const after = db
      .prepare('SELECT clean_streak, spontaneous_ok FROM error WHERE code = ?')
      .get(pos.error_code) as { clean_streak: number; spontaneous_ok: number };
    expect(after.spontaneous_ok).toBe(before.spontaneous_ok + 1);
    expect(after.clean_streak).toBe(before.clean_streak + 1);
  });

  it('drops a mastered topic back to studying on an accepted error', async () => {
    const { decide } = await mod();
    const { f } = await firstErrorFinding();
    const topic = (
      db.prepare('SELECT topic_id FROM error WHERE code = ?').get(f.error_code) as {
        topic_id: string | null;
      }
    ).topic_id;
    expect(topic).toBeTruthy();

    db.prepare("UPDATE topic_state SET status = 'mastered' WHERE topic_id = ?").run(topic);
    decide(f.id, 'accepted');

    const st = db.prepare('SELECT status FROM topic_state WHERE topic_id = ?').get(topic) as {
      status: string;
    };
    expect(st.status).toBe('studying');
  });

  it('is idempotent — deciding twice does not double-count', async () => {
    const { decide } = await mod();
    const { f } = await firstErrorFinding();
    decide(f.id, 'accepted');
    const after1 = db
      .prepare('SELECT occurrences FROM error WHERE code = ?')
      .get(f.error_code) as { occurrences: number };
    decide(f.id, 'accepted');
    const after2 = db
      .prepare('SELECT occurrences FROM error WHERE code = ?')
      .get(f.error_code) as { occurrences: number };
    expect(after2.occurrences).toBe(after1.occurrences);
  });
});

describe('for Lorena (SPEC §6)', () => {
  it('lists only accepted errors, and explains why each needs her', async () => {
    const { decide, findingsFor, forLorena } = await mod();
    const r = await ingestClass();
    const errs = findingsFor(r.transcriptId).filter((x) => x.kind === 'error' && x.error_code);
    for (const f of errs) decide(f.id, 'accepted');

    const list = forLorena(r.transcriptId);
    expect(list.length).toBeGreaterThan(0);
    expect(list.length).toBeLessThanOrEqual(3);
    for (const l of list) expect(l.why.length).toBeGreaterThan(30);
  });

  it('is empty before anything is accepted', async () => {
    const { forLorena } = await mod();
    const r = await ingestClass();
    expect(forLorena(r.transcriptId)).toEqual([]);
  });
});

describe('review lifecycle', () => {
  it('closes only when nothing is pending', async () => {
    const { closeReview, decide, findingsFor } = await mod();
    const r = await ingestClass();

    closeReview(r.transcriptId);
    let t = db.prepare('SELECT reviewed_at FROM transcript WHERE id = ?').get(r.transcriptId) as {
      reviewed_at: string | null;
    };
    expect(t.reviewed_at).toBeNull();

    for (const f of findingsFor(r.transcriptId)) decide(f.id, 'rejected');
    closeReview(r.transcriptId);

    t = db.prepare('SELECT reviewed_at FROM transcript WHERE id = ?').get(r.transcriptId) as {
      reviewed_at: string | null;
    };
    expect(t.reviewed_at).toBeTruthy();
  });

  it('counts what is still waiting across all transcripts', async () => {
    const { pendingCount } = await mod();
    const r = await ingestClass();
    expect(pendingCount()).toBe(r.errors + r.positives);
  });
});

describe('duplicate transcripts', () => {
  /**
   * Real usage found this: of nine transcript files supplied across two
   * batches, three were byte-identical to earlier ones under different names.
   * That is what a folder of exports looks like, not user error — but a class
   * counted twice doubles every error drawn from it, and §4 weights errors by
   * log(1 + occurrences), so the duplicate quietly promotes a topic up the
   * recommendation order.
   */
  it('refuses to import the same class twice and says which one it is', async () => {
    const { ingest } = await mod();
    const first = ingest({ raw: CLASS, learner: 'Joe', source: 'lorena', classDate: '2026-08-05' });
    expect(first.duplicateOf).toBeUndefined();
    expect(first.errors).toBeGreaterThan(0);

    const again = ingest({
      raw: CLASS,
      learner: 'Joe',
      source: 'lorena',
      classDate: '2026-08-11', // re-filed under a different date, same content
      title: 'Spanish Class 6',
    });

    expect(again.duplicateOf?.id).toBe(first.transcriptId);
    expect(again.transcriptId).toBe(first.transcriptId);
    // Nothing was analysed a second time.
    expect(again.errors).toBe(0);
    expect(again.positives).toBe(0);
  });

  it('inserts no second row and no second set of findings', async () => {
    const { ingest } = await mod();
    ingest({ raw: CLASS, learner: 'Joe', source: 'lorena', classDate: '2026-08-05' });
    const rows = () =>
      (db.prepare('SELECT COUNT(*) AS n FROM transcript').get() as { n: number }).n;
    const findings = () =>
      (db.prepare('SELECT COUNT(*) AS n FROM transcript_finding').get() as { n: number }).n;
    const t = rows();
    const f = findings();

    ingest({ raw: CLASS, learner: 'Joe', source: 'lorena', classDate: '2026-08-05' });
    expect(rows()).toBe(t);
    expect(findings()).toBe(f);
  });

  it('ignores line endings, trailing spaces and blank lines', async () => {
    // A re-export of the same class should not read as a new one.
    const { ingest } = await mod();
    const first = ingest({ raw: CLASS, learner: 'Joe', source: 'lorena', classDate: '2026-08-05' });
    const reExported = CLASS.split('\n').map((l) => `${l}  `).join('\r\n') + '\r\n\r\n';
    const again = ingest({
      raw: reExported,
      learner: 'Joe',
      source: 'lorena',
      classDate: '2026-08-05',
    });
    expect(again.duplicateOf?.id).toBe(first.transcriptId);
  });

  it('treats a genuinely different class as new', async () => {
    const { ingest } = await mod();
    const first = ingest({ raw: CLASS, learner: 'Joe', source: 'lorena', classDate: '2026-08-05' });
    const other = ingest({
      raw: CLASS.replace('la obra', 'el expediente'),
      learner: 'Joe',
      source: 'lorena',
      classDate: '2026-08-12',
    });
    expect(other.duplicateOf).toBeUndefined();
    expect(other.transcriptId).not.toBe(first.transcriptId);
  });

  it('hashes content, not case or accents — those are the Spanish', async () => {
    const { contentHash } = await mod();
    expect(contentHash('Tenemos un problema')).not.toBe(contentHash('tenemos un problema'));
    expect(contentHash('el análisis')).not.toBe(contentHash('el analisis'));
  });
});
