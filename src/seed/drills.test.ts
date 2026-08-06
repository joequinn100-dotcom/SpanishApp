import { describe, expect, it } from 'vitest';
import { DRILLS, ERRORS, TOPICS, seed, drillKey, gauntletFor } from './index';
import { DRILL_KINDS, grade, normalize } from '@/domain/grading';
import { migrate, openDatabase } from '@/db';
import type { DB } from '@/db';

function freshDb(): DB {
  const db = openDatabase(':memory:');
  migrate(db);
  return db;
}

const topicIds = new Set(TOPICS.map((t) => t.id));
const errorCodes = new Set(ERRORS.map((e) => e.code));

/**
 * These authored drills never passed SPEC §5's three-verifier gauntlet, because
 * there is no API key yet. This suite is the interim gate, and CLAUDE.md's
 * "never show the user content that hasn't passed the gauntlet" is why it is
 * strict rather than sampling: every item, every field.
 */
describe('drill integrity', () => {
  it('has drills at all', () => {
    expect(DRILLS.length).toBeGreaterThan(60);
  });

  it('references real topics and real error codes', () => {
    for (const [i, d] of DRILLS.entries()) {
      expect(topicIds.has(d.topicId), `drill[${i}] topic ${d.topicId}`).toBe(true);
      if (d.targetsError) {
        expect(errorCodes.has(d.targetsError), `drill[${i}] error ${d.targetsError}`).toBe(true);
      }
    }
  });

  it('uses only declared drill kinds and difficulties', () => {
    for (const [i, d] of DRILLS.entries()) {
      expect(DRILL_KINDS, `drill[${i}]`).toContain(d.kind);
      expect(d.difficulty, `drill[${i}]`).toBeGreaterThanOrEqual(1);
      expect(d.difficulty, `drill[${i}]`).toBeLessThanOrEqual(5);
    }
  });

  it('gives every item a unique seed key', () => {
    const keys = DRILLS.map((d, i) => drillKey(d, i));
    expect(new Set(keys).size).toBe(keys.length);
  });

  /* ---------------- answer keys ---------------- */

  it('grades its own answer as correct', () => {
    // The obvious test, and the one that catches a typo in a key.
    for (const [i, d] of DRILLS.entries()) {
      const g = grade(d.payload, d.payload.answer, d.targetsError);
      expect(g.verdict, `drill[${i}] ${d.payload.answer}`).toBe('correct');
    }
  });

  it('grades every accepted alternative as fully correct', () => {
    for (const [i, d] of DRILLS.entries()) {
      for (const alt of d.payload.accept ?? []) {
        const g = grade(d.payload, alt, d.targetsError);
        expect(g.verdict, `drill[${i}] accept «${alt}»`).toBe('correct');
      }
    }
  });

  it('grades every distractor as a distractor, not as correct', () => {
    // A distractor that collides with the key would silently mark a wrong
    // answer right — the worst failure this file can have.
    for (const [i, d] of DRILLS.entries()) {
      for (const x of d.payload.distractors ?? []) {
        const g = grade(d.payload, x.answer, d.targetsError);
        expect(g.verdict, `drill[${i}] distractor «${x.answer}»`).toBe('distractor');
      }
    }
  });

  it('has no distractor that duplicates another distractor in the same item', () => {
    for (const [i, d] of DRILLS.entries()) {
      const answers = (d.payload.distractors ?? []).map((x) => normalize(x.answer));
      expect(new Set(answers).size, `drill[${i}]`).toBe(answers.length);
    }
  });

  it('never uses an empty string as a distractor', () => {
    // Blank is its own verdict, so an empty distractor is unreachable.
    for (const [i, d] of DRILLS.entries()) {
      for (const x of d.payload.distractors ?? []) {
        expect(normalize(x.answer), `drill[${i}]`).not.toBe('');
      }
    }
  });

  it('names a real error code on every distractor that claims one', () => {
    for (const [i, d] of DRILLS.entries()) {
      for (const x of d.payload.distractors ?? []) {
        if (x.errorCode) {
          expect(errorCodes.has(x.errorCode), `drill[${i}] ${x.errorCode}`).toBe(true);
        }
      }
    }
  });

  /* ---------------- pedagogy ---------------- */

  it('explains thoroughly — SPEC §11 forbids abbreviated grammar explanations', () => {
    for (const [i, d] of DRILLS.entries()) {
      expect(d.payload.explanation.length, `drill[${i}] ${d.topicId}`).toBeGreaterThan(300);
    }
  });

  it('gives a reason on every distractor, not just a rejection', () => {
    for (const [i, d] of DRILLS.entries()) {
      for (const x of d.payload.distractors ?? []) {
        expect(x.feedback.length, `drill[${i}] «${x.answer}»`).toBeGreaterThan(40);
      }
    }
  });

  it('gives every item an instruction and a sentence', () => {
    for (const [i, d] of DRILLS.entries()) {
      expect(d.payload.prompt.length, `drill[${i}]`).toBeGreaterThan(10);
      expect(d.payload.sentence.length, `drill[${i}]`).toBeGreaterThan(10);
    }
  });

  /* ---------------- context (SPEC §11) ---------------- */

  it('sits in a construction, engineering or consulting context', () => {
    // "Every Spanish example lives in construction/infrastructure consulting
    // context" — CLAUDE.md. A drill about a cat on a table fails here.
    const domain = new RegExp(
      [
        'obra',
        'excavaci',
        'acabado',
        'plano',
        'cliente',
        'proveedor',
        'contratista',
        'presupuesto',
        'cronograma',
        'informe',
        'reuni[óo]n',
        'expediente',
        'valoriz',
        'supervis',
        'ingenier',
        'concreto',
        'cimentaci',
        'encofrado',
        'vaciado',
        'licitaci',
        'adenda',
        'contrato',
        'partida',
        'alcance',
        'metrado',
        'cuadrilla',
        'equipo',
        'entrega',
        'material',
        'seguridad',
        'acta',
        'consulta',
        'costo',
        'plazo',
        'capataz|capataces',
        'operario',
        'proyecto',
        'estructura',
        'tuber',
        'instalaci',
        'especificaci',
        'comit[ée]',
        'oficina',
        'turno',
        'torre',
        'amoladora',
        'losa',
        'inspecci',
        'avance',
        'supuestos|premisas',
        'cl[áa]usula',
        'adicional',
      ].join('|'),
      'i',
    );
    for (const [i, d] of DRILLS.entries()) {
      const haystack = `${d.payload.context ?? ''} ${d.payload.sentence} ${d.payload.answer}`;
      expect(domain.test(haystack), `drill[${i}] ${d.topicId}: «${d.payload.sentence}»`).toBe(true);
    }
  });

  /* ---------------- coverage ---------------- */

  it('covers every active error in the log', () => {
    // §4 guarantees the top-3 active errors appear in every warm-up. That
    // guarantee is empty for an error with no drill written for it.
    const covered = new Set(DRILLS.map((d) => d.targetsError).filter(Boolean));
    const uncovered = ERRORS.filter((e) => e.status === 'active' && !covered.has(e.code));
    expect(uncovered.map((e) => e.code)).toEqual([]);
  });

  it('gives each active error more than one drill, so a session can vary', () => {
    const counts = new Map<string, number>();
    for (const d of DRILLS) {
      if (d.targetsError) counts.set(d.targetsError, (counts.get(d.targetsError) ?? 0) + 1);
    }
    for (const e of ERRORS.filter((x) => x.status === 'active')) {
      expect(counts.get(e.code) ?? 0, e.code).toBeGreaterThanOrEqual(2);
    }
  });

  it('gives every topic it touches enough items to form a block', () => {
    const counts = new Map<string, number>();
    for (const d of DRILLS) counts.set(d.topicId, (counts.get(d.topicId) ?? 0) + 1);
    for (const [topic, n] of counts) {
      expect(n, topic).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('seeding drills into SQLite', () => {
  it('writes every drill as authored content', () => {
    const db = freshDb();
    const result = seed(db);
    expect(result.drills).toBe(DRILLS.length);

    const row = db
      .prepare("SELECT count(*) AS n FROM content WHERE provenance = 'authored'")
      .get() as { n: number };
    expect(row.n).toBe(DRILLS.length);
  });

  it('stores a payload that round-trips through JSON', () => {
    const db = freshDb();
    seed(db);
    const rows = db.prepare('SELECT payload FROM content').all() as { payload: string }[];
    for (const r of rows) {
      const parsed = JSON.parse(r.payload);
      expect(typeof parsed.answer).toBe('string');
      expect(typeof parsed.explanation).toBe('string');
    }
  });

  it('is idempotent — re-seeding updates in place rather than duplicating', () => {
    // Content ids are foreign keys from `attempt`. Duplicating on re-seed would
    // strand every historical attempt against a retired row.
    const db = freshDb();
    seed(db);
    const ids = db.prepare('SELECT id FROM content ORDER BY id').all() as { id: number }[];
    seed(db);
    const after = db.prepare('SELECT id FROM content ORDER BY id').all() as { id: number }[];
    expect(after).toEqual(ids);
  });

  it('stores the score the panel actually gave, and the audit trail behind it', () => {
    // The point of this test is that nothing invents a score. Every drill either
    // carries a verdict a real §5 panel recorded, or carries 0 and says why.
    const db = freshDb();
    seed(db);
    const rows = db
      .prepare('SELECT seed_key, gauntlet_score, gauntlet_log, verified_at FROM content')
      .all() as {
      seed_key: string;
      gauntlet_score: number;
      gauntlet_log: string;
      verified_at: string;
    }[];
    expect(rows).toHaveLength(DRILLS.length);

    for (const row of rows) {
      const expected = gauntletFor(row.seed_key);
      if (!expected) {
        expect(row.gauntlet_score).toBe(0);
        expect(JSON.parse(row.gauntlet_log).rounds).toEqual([]);
        continue;
      }
      expect(row.gauntlet_score).toBe(expected.score);
      expect(row.verified_at).toBe(expected.verifiedAt);

      const log = JSON.parse(row.gauntlet_log) as typeof expected;
      expect(log.verdict).toBe('accepted');
      // §5 accepts only when all three verifiers pass and the mean reaches 8.0.
      expect(log.linguistic.pass && log.register.pass && log.pedagogy.pass).toBe(true);
      const mean = (log.linguistic.score + log.register.score + log.pedagogy.score) / 3;
      expect(mean).toBeGreaterThanOrEqual(8);
      expect(log.score).toBeCloseTo(mean, 5);
      // The trail is the reason the score is believable — an accept with no
      // recorded revisions would mean the panel found nothing across 74 items.
      expect(log.revisions.length).toBeGreaterThan(0);
    }
  });

  it('never quarantines content into the seeded set', () => {
    // SPEC §5: quarantined content is withheld from the learner, so it must not
    // reach `content` at all. If a future batch is quarantined this test is the
    // thing that stops it being seeded anyway.
    const db = freshDb();
    seed(db);
    const logs = db.prepare('SELECT gauntlet_log FROM content').all() as {
      gauntlet_log: string;
    }[];
    for (const { gauntlet_log } of logs) {
      expect(JSON.parse(gauntlet_log).verdict).not.toBe('quarantined');
    }
  });
});
