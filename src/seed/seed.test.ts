import { describe, expect, it } from 'vitest';
import { ERRORS, LEVELS, PREREQS, STRANDS, TOPICS, seed, recomputeAvailability } from './index';
import { migrate, openDatabase } from '@/db';
import type { DB } from '@/db';

function freshDb(): DB {
  const db = openDatabase(':memory:');
  migrate(db);
  return db;
}

const topicIds = new Set(TOPICS.map((t) => t.id));
const levelIds = new Set(LEVELS.map((l) => l.id));
const strandIds = new Set(STRANDS.map((s) => s.id));
const LEVEL_ORDINAL = new Map(LEVELS.map((l) => [l.id, l.ordinal]));

describe('topic integrity', () => {
  it('has no duplicate ids', () => {
    expect(topicIds.size).toBe(TOPICS.length);
  });

  it('ids follow {level}.{strand}.{name} and match their own columns', () => {
    for (const t of TOPICS) {
      const [lvl, strand] = t.id.split('.');
      expect(t.id.split('.')).toHaveLength(3);
      expect(lvl.toUpperCase(), `${t.id} level prefix`).toBe(t.level);
      expect(strandIds.has(strand as never), `${t.id} strand prefix`).toBe(true);
      expect(strand, `${t.id} strand prefix matches column`).toBe(t.strand);
    }
  });

  it('uses only declared levels and strands', () => {
    for (const t of TOPICS) {
      expect(levelIds.has(t.level)).toBe(true);
      expect(strandIds.has(t.strand)).toBe(true);
    }
  });

  it('gives every topic a real summary and search terms', () => {
    for (const t of TOPICS) {
      expect(t.summary.length, `${t.id} summary`).toBeGreaterThan(80);
      expect(t.searchTerms.split('|').length, `${t.id} search terms`).toBeGreaterThanOrEqual(3);
    }
  });

  it('never invents a book reference', () => {
    // bookRef is either null or a real Read2Speak unit. Anything else means a
    // citation was guessed rather than sourced.
    const pattern = /^(Foundations|Breakthrough|Mastery) U\d{1,2}(\.\d+\.\d+)?$/;
    for (const t of TOPICS) {
      if (t.bookRef !== null) expect(t.bookRef, `${t.id} book ref`).toMatch(pattern);
    }
  });

  it('covers every topic named in the SPEC §3 prerequisite graph', () => {
    // These IDs are quoted verbatim in the spec; a rename silently breaks routing.
    const fromSpec = [
      'b1.verb.preterito', 'b1.verb.imperfecto', 'b1.verb.pluscuamperfecto',
      'b1.verb.presente_perfecto', 'b1.mood.subj_presente', 'b2.mood.subj_imperfecto',
      'b2.mood.subj_perfecto', 'b2.mood.subj_pluscuamperfecto', 'b2.mood.si_counterfactual',
      'b2.mood.si_hipotetico', 'b1.pron.od_oi', 'b1.pron.se_constructions',
      'b2.pron.clitic_combos', 'b1.syntax.relativos', 'b2.mood.subj_relativas',
      'c1.syntax.subordinacion', 'b2.syntax.estilo_indirecto',
      'b1.discourse.conectores_1', 'b2.discourse.conectores_2', 'b2.prof.diplomatic',
    ];
    for (const id of fromSpec) expect(topicIds.has(id), `spec topic ${id}`).toBe(true);
  });

  it('excludes por/para from scheduling, per SPEC §10', () => {
    const porPara = TOPICS.filter((t) => t.id.includes('por_para'));
    expect(porPara.length).toBeGreaterThan(0);
    for (const t of porPara) expect(t.noSchedule, `${t.id}`).toBe(true);
  });
});

describe('prerequisite graph', () => {
  it('resolves every endpoint to a real topic', () => {
    for (const p of PREREQS) {
      expect(topicIds.has(p.topic), `prereq edge target ${p.topic}`).toBe(true);
      expect(topicIds.has(p.prereq), `prereq edge source ${p.prereq}`).toBe(true);
    }
  });

  it('has no self-edges', () => {
    for (const p of PREREQS) expect(p.topic).not.toBe(p.prereq);
  });

  it('is acyclic', () => {
    const edges = new Map<string, string[]>();
    for (const p of PREREQS) {
      edges.set(p.topic, [...(edges.get(p.topic) ?? []), p.prereq]);
    }
    const WHITE = 0, GREY = 1, BLACK = 2;
    const colour = new Map<string, number>();
    const stack: string[] = [];

    const visit = (node: string): string[] | null => {
      colour.set(node, GREY);
      stack.push(node);
      for (const next of edges.get(node) ?? []) {
        const c = colour.get(next) ?? WHITE;
        if (c === GREY) return [...stack, next]; // cycle
        if (c === WHITE) {
          const cyc = visit(next);
          if (cyc) return cyc;
        }
      }
      colour.set(node, BLACK);
      stack.pop();
      return null;
    };

    for (const id of topicIds) {
      if ((colour.get(id) ?? WHITE) === WHITE) {
        const cycle = visit(id);
        expect(cycle, cycle ? `cycle: ${cycle.join(' -> ')}` : '').toBeNull();
      }
    }
  });

  it('never makes a topic depend on a higher level', () => {
    for (const p of PREREQS) {
      const t = TOPICS.find((x) => x.id === p.topic)!;
      const r = TOPICS.find((x) => x.id === p.prereq)!;
      expect(
        LEVEL_ORDINAL.get(r.level)!,
        `${p.topic} (${t.level}) depends on ${p.prereq} (${r.level})`,
      ).toBeLessThanOrEqual(LEVEL_ORDINAL.get(t.level)!);
    }
  });

  it('leaves at least one topic with no hard prerequisites', () => {
    const blocked = new Set(PREREQS.filter((p) => p.strength === 'hard').map((p) => p.topic));
    expect([...topicIds].some((id) => !blocked.has(id))).toBe(true);
  });
});

describe('error log integrity', () => {
  it('has no duplicate codes', () => {
    expect(new Set(ERRORS.map((e) => e.code)).size).toBe(ERRORS.length);
  });

  it('links only to real topics', () => {
    for (const e of ERRORS) {
      if (e.topicId) expect(topicIds.has(e.topicId), `${e.code} -> ${e.topicId}`).toBe(true);
    }
  });

  it('gives every error a thorough rule, not a one-liner', () => {
    // SPEC §11 rejects abbreviated explanations outright.
    for (const e of ERRORS) {
      expect(e.rule.length, `${e.code} rule length`).toBeGreaterThan(300);
    }
  });

  it('carries non-zero occurrences so the §4 weight formula can see them', () => {
    // weight multiplies by log(1 + occurrences): a zero makes an error
    // permanently unselectable.
    for (const e of ERRORS) {
      if (e.status !== 'resolved') expect(e.occurrences, `${e.code}`).toBeGreaterThan(0);
    }
  });

  it('seeds the whole §10 table', () => {
    const active = ERRORS.filter((e) => e.status === 'active');
    const resolved = ERRORS.filter((e) => e.status === 'resolved');
    expect(active).toHaveLength(19);
    expect(resolved).toHaveLength(7);
  });

  it('includes the two severity-5 errors §10 names', () => {
    const sev5 = ERRORS.filter((e) => e.severity === 5).map((e) => e.code);
    expect(sev5).toContain('verb.preterito_persona');
    expect(sev5).toContain('mood.subj_imperfecto_missing');
  });
});

/**
 * SPEC §11: "Neutral Latin American Spanish. No vosotros, ever."
 *
 * The source books are Peninsular-flavoured — Foundations alone carries 85
 * vosotros forms and 623 Castilian /θ/ pronunciation respellings. This suite is
 * what stops any of that reaching a seeded string.
 */
describe('register: no Peninsular Spanish reaches the seed', () => {
  const strings = [
    ...TOPICS.flatMap((t) => [
      { where: `${t.id}.summary`, text: t.summary },
      { where: `${t.id}.nameEs`, text: t.nameEs },
      { where: `${t.id}.searchTerms`, text: t.searchTerms },
    ]),
    ...ERRORS.flatMap((e) => [
      { where: `${e.code}.rule`, text: e.rule },
      { where: `${e.code}.wrong`, text: e.wrong },
      { where: `${e.code}.right`, text: e.right },
    ]),
  ];

  it('contains no vosotros pronoun or clitic', () => {
    for (const s of strings) {
      expect(s.text, s.where).not.toMatch(/\bvosotros\b|\bvuestr[oa]s?\b/i);
    }
  });

  it('contains no -áis/-éis/-ís vosotros verb endings', () => {
    // Excludes legitimate words that end the same way (seis, dieciséis, país...).
    for (const s of strings) {
      const hits = (s.text.match(/\b[a-záéíóúñ]{3,}(áis|éis)\b/gi) ?? []).filter(
        (w) => !/^(seis|dieciséis|veintiséis)$/i.test(w),
      );
      expect(hits, s.where).toEqual([]);
    }
  });

  it('contains no Peninsular lexis flagged by the §5 register verifier', () => {
    // Word-boundary matched so "vale" as a noun stem or "coger" inside a longer
    // token doesn't produce a phantom failure.
    const banned = /\b(ordenador|m[óo]vil|chungo|molar|tío|vale)\b/i;
    for (const s of strings) {
      expect(s.text, s.where).not.toMatch(banned);
    }
  });

  it('contains no Castilian theta pronunciation respellings', () => {
    // The books respell gracias as GRAH-thyahs and cinco as THEEN-koh.
    for (const s of strings) {
      expect(s.text, s.where).not.toMatch(/\b[a-z]*-?th[eiy][a-z]*-?[A-Z]/);
    }
  });
});

describe('seeding into SQLite', () => {
  it('writes the full curriculum and is idempotent', () => {
    const db = freshDb();
    const first = seed(db);
    expect(first.topics).toBe(TOPICS.length);

    const count = (t: string) =>
      (db.prepare(`SELECT count(*) AS n FROM ${t}`).get() as { n: number }).n;

    expect(count('topic')).toBe(TOPICS.length);
    expect(count('topic_state')).toBe(TOPICS.length);
    expect(count('topic_prereq')).toBe(PREREQS.length);
    expect(count('error')).toBe(ERRORS.length);

    seed(db); // again
    expect(count('topic')).toBe(TOPICS.length);
    expect(count('topic_prereq')).toBe(PREREQS.length);
    expect(count('error')).toBe(ERRORS.length);
    db.close();
  });

  it('preserves user progress across a re-seed', () => {
    const db = freshDb();
    seed(db);
    db.prepare(
      "UPDATE topic_state SET status='mastered', attempts=40, correct=38 WHERE topic_id=?",
    ).run('b1.verb.preterito');

    seed(db);
    const row = db
      .prepare('SELECT status, attempts FROM topic_state WHERE topic_id = ?')
      .get('b1.verb.preterito') as { status: string; attempts: number };
    expect(row.status).toBe('mastered');
    expect(row.attempts).toBe(40);
    db.close();
  });

  it('unlocks the entry points and leaves gated topics locked', () => {
    const db = freshDb();
    seed(db);

    const status = (id: string) =>
      (db.prepare('SELECT status FROM topic_state WHERE topic_id = ?').get(id) as {
        status: string;
      }).status;

    // No hard prerequisites → available from a cold start.
    expect(status('a1.noun.genero')).toBe('available');
    expect(status('b1.syntax.relativos')).toBe('available');
    // Gated behind the present subjunctive and the preterite.
    expect(status('b2.mood.subj_imperfecto')).toBe('locked');
    expect(status('b2.mood.si_hipotetico')).toBe('locked');
    db.close();
  });

  it('unlocks a topic once its hard prereqs are mastered', () => {
    const db = freshDb();
    seed(db);
    const master = db.prepare("UPDATE topic_state SET status='mastered' WHERE topic_id=?");
    for (const id of [
      'a2.verb.preterito_regular', 'b1.verb.preterito',
      'a1.verb.presente_regular', 'b1.mood.subj_presente',
    ]) master.run(id);

    recomputeAvailability(db);
    const row = db
      .prepare('SELECT status FROM topic_state WHERE topic_id = ?')
      .get('b2.mood.subj_imperfecto') as { status: string };
    expect(row.status).toBe('available');
    db.close();
  });

  it('never offers a C-level topic before the B2 spine is done', () => {
    // Found by eye in the curriculum view: C-level topics wired with only soft
    // prerequisites were all `available` from a cold start, putting C2 legal
    // register ahead of B1 preterite narration.
    const db = freshDb();
    seed(db);
    const open = db
      .prepare(
        `SELECT t.id, t.level_id FROM topic t
           JOIN topic_state s ON s.topic_id = t.id
          WHERE s.status = 'available' AND t.level_id IN ('C1','C2')`,
      )
      .all() as { id: string; level_id: string }[];
    expect(open.map((r) => r.id)).toEqual([]);
    db.close();
  });

  it('offers a workable cold start at A-level and the unblocked B1 topics', () => {
    const db = freshDb();
    seed(db);
    const open = db
      .prepare(
        `SELECT t.level_id AS lvl, count(*) AS n FROM topic t
           JOIN topic_state s ON s.topic_id = t.id
          WHERE s.status = 'available' GROUP BY t.level_id`,
      )
      .all() as { lvl: string; n: number }[];
    const byLevel = Object.fromEntries(open.map((r) => [r.lvl, r.n]));
    expect(byLevel.A1 ?? 0).toBeGreaterThan(5);
    // SPEC §3: relative pronouns and connectors are B1 and currently unblocked.
    expect(byLevel.B1 ?? 0).toBeGreaterThan(0);
    db.close();
  });

  it('enforces foreign keys', () => {
    const db = freshDb();
    seed(db);
    expect(() =>
      db
        .prepare('INSERT INTO topic_prereq (topic_id, prereq_id, strength) VALUES (?,?,?)')
        .run('b2.mood.subj_imperfecto', 'does.not.exist', 'hard'),
    ).toThrow(/FOREIGN KEY/i);
    db.close();
  });
});
