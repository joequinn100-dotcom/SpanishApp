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

const mod = () => import('./vocab');
const idOf = (term: string) =>
  (db.prepare('SELECT id FROM vocab WHERE term = ?').get(term) as { id: number }).id;

describe('the queue', () => {
  it('starts every word as new and due', async () => {
    const { vocabStats, dueVocabCount } = await mod();
    const s = vocabStats();
    expect(s.new).toBe(s.total);
    expect(dueVocabCount()).toBe(s.total);
  });

  it('caps how many new words appear at once', async () => {
    // Otherwise a fresh deck would present 74 introductions and no reviews.
    const { dueVocab } = await mod();
    expect(dueVocab(20)).toHaveLength(5);
  });

  it('asks for recognition on sight and production once known', async () => {
    const { dueVocab, reviewCard } = await mod();
    expect(dueVocab(1)[0].direction).toBe('es_to_en');

    const id = dueVocab(1)[0].id;
    reviewCard(id, 'good');
    db.prepare("UPDATE vocab SET due_at = '2020-01-01T00:00:00.000Z' WHERE id = ?").run(id);
    const again = (await mod()).dueVocab(20).find((c) => c.id === id)!;
    expect(again.direction).toBe('en_to_es');
  });

  it('puts a due review ahead of a new word', async () => {
    const { dueVocab, reviewCard } = await mod();
    const id = idOf('subsanar');
    reviewCard(id, 'good');
    db.prepare("UPDATE vocab SET due_at = '2020-01-01T00:00:00.000Z' WHERE id = ?").run(id);
    expect(dueVocab(10)[0].id).toBe(id);
  });
});

describe('reviewCard', () => {
  it('writes the new schedule and a history row together', async () => {
    const { reviewCard } = await mod();
    const id = idOf('sin embargo');
    const r = reviewCard(id, 'good');

    const v = db.prepare('SELECT stage, reps, due_at, interval_days FROM vocab WHERE id = ?').get(id) as {
      stage: string; reps: number; due_at: string; interval_days: number;
    };
    expect(v.stage).toBe('recognizing');
    expect(v.reps).toBe(1);
    expect(v.due_at).toBeTruthy();
    expect(v.interval_days).toBe(r.intervalDays);

    const hist = db.prepare('SELECT recall, interval_days FROM vocab_review WHERE vocab_id = ?').all(id);
    expect(hist).toEqual([{ recall: 'good', interval_days: v.interval_days }]);
  });

  it('lengthens the interval on each success and collapses it on a lapse', async () => {
    const { reviewCard } = await mod();
    const id = idOf('subsanar');
    const a = reviewCard(id, 'good');
    const b = reviewCard(id, 'good');
    expect(b.intervalDays).toBeGreaterThan(a.intervalDays);

    const c = reviewCard(id, 'again');
    expect(c.intervalDays).toBe(1);
    const v = db.prepare('SELECT lapses, reps FROM vocab WHERE id = ?').get(id) as {
      lapses: number; reps: number;
    };
    expect(v.lapses).toBe(1);
    expect(v.reps).toBe(0);
  });

  it('reaches "using" but never the top stage, however many times it is answered', async () => {
    // The rule the whole module is built around.
    const { reviewCard } = await mod();
    const id = idOf('la adenda');
    for (let i = 0; i < 15; i++) reviewCard(id, 'easy');
    const v = db.prepare('SELECT stage FROM vocab WHERE id = ?').get(id) as { stage: string };
    expect(v.stage).toBe('using');
  });

  it('attaches the review to the open session when there is one', async () => {
    const { startSession } = await import('./practice');
    const { reviewCard } = await mod();
    const s = startSession(null);
    reviewCard(idOf('subsanar'), 'good', s.id);
    const row = db.prepare('SELECT session_id FROM vocab_review').get() as { session_id: number };
    expect(row.session_id).toBe(s.id);
  });

  it('refuses an unknown card rather than writing a phantom review', async () => {
    const { reviewCard } = await mod();
    expect(() => reviewCard(999999, 'good')).toThrow();
    const n = db.prepare('SELECT count(*) AS n FROM vocab_review').get() as { n: number };
    expect(n.n).toBe(0);
  });
});

describe('spontaneous use', () => {
  it('finds vocabulary in the learner’s own text, including inflected forms', async () => {
    const { vocabUsedIn } = await mod();
    const used = vocabUsedIn(
      'Subsanamos las observaciones y presentamos la valorización; sin embargo, el adicional sigue pendiente.',
    );
    expect(used).toContain('subsanar');
    expect(used).toContain('la valorización');
    expect(used).toContain('sin embargo');
    expect(used).toContain('la observación');
  });

  it('does not credit a phrase whose verb never appeared', async () => {
    // The text says «las observaciones» and «sigue pendiente». Neither
    // «levantar una observación» nor «quedar pendiente» was actually used, and
    // this is the only route to the top stage — over-crediting it would hand
    // out a promotion the learner did not earn.
    const { vocabUsedIn } = await mod();
    const used = vocabUsedIn(
      'Subsanamos las observaciones y el adicional sigue pendiente.',
    );
    expect(used).not.toContain('levantar una observación');
    expect(used).not.toContain('quedar pendiente');
  });

  it('does not let a two-letter verb stem match everything', async () => {
    const { vocabUsedIn } = await mod();
    // «dar seguimiento» needs «dar»; «hacer seguimiento» is a different phrase.
    const used = vocabUsedIn('Hay que hacer seguimiento a la consulta.');
    expect(used).toContain('hacer seguimiento');
    expect(used).not.toContain('dar seguimiento');
  });

  it('finds nothing in text that uses none of it', async () => {
    const { vocabUsedIn } = await mod();
    expect(vocabUsedIn('Hola, ¿qué tal?')).toEqual([]);
  });

  it('promotes only through unprompted use', async () => {
    const { markVocabSpontaneous } = await mod();
    const n = markVocabSpontaneous(['sin embargo', 'la adenda']);
    expect(n).toBe(2);
    const v = db.prepare("SELECT count(*) AS n FROM vocab WHERE stage = 'spontaneous'").get() as {
      n: number;
    };
    expect(v.n).toBe(2);
  });

  it('is idempotent — the same word twice is promoted once', async () => {
    const { markVocabSpontaneous } = await mod();
    markVocabSpontaneous(['sin embargo']);
    expect(markVocabSpontaneous(['sin embargo'])).toBe(0);
  });

  it('does not demote a spontaneous word on a later card review', async () => {
    const { markVocabSpontaneous, reviewCard } = await mod();
    markVocabSpontaneous(['subsanar']);
    reviewCard(idOf('subsanar'), 'good');
    const v = db.prepare('SELECT stage FROM vocab WHERE term = ?').get('subsanar') as {
      stage: string;
    };
    expect(v.stage).toBe('spontaneous');
  });

  it('promotes words used in an ingested transcript', async () => {
    const { ingest } = await import('./transcripts');
    const r = ingest({
      // Unlabelled, so the whole text is the learner's own — the "pasted my own
      // writing" case. With a speaker label and no learner picked, the pipeline
      // correctly analyses nothing at all.
      raw: 'Subsanamos las observaciones; sin embargo, el adicional sigue pendiente.',
      learner: null,
      source: 'self_recording',
      classDate: '2026-08-06',
    });
    expect(r.vocabPromoted).toBeGreaterThan(0);
    const v = db.prepare("SELECT count(*) AS n FROM vocab WHERE stage = 'spontaneous'").get() as {
      n: number;
    };
    expect(v.n).toBe(r.vocabPromoted);
  });
});
