import { describe, expect, it } from 'vitest';
import {
  VOCAB,
  DRILLS,
  ERRORS,
  LEVELS,
  PREREQS,
  STRANDS,
  TOPICS,
  seed,
  recomputeAvailability,
} from './index';
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

  it('leaves no Read2Speak unit without a topic, except the review unit', () => {
    // The books are the curriculum authority (CLAUDE.md): they decide which
    // topics exist and which unit each belongs to. Reading them turned up six
    // units with no topic at all, which is a curriculum hole rather than a
    // stylistic one — a whole unit of the syllabus the app could not schedule,
    // teach or search. This locks the coverage in.
    //
    // Foundations U15 is the deliberate exception. "Spanish A2 in Real Life" is
    // a consolidation unit — dialogues and scenarios recycling U1–U14 with no
    // new grammar — so a topic for it would be invented rather than sourced.
    const EXPECTED_UNITS = 15;
    const EXEMPT = new Set(['Foundations U15']);

    for (const book of ['Foundations', 'Breakthrough', 'Mastery'] as const) {
      const covered = new Set<number>();
      for (const t of TOPICS) {
        const m = t.bookRef?.match(new RegExp(`^${book} U(\\d+)`));
        if (m) covered.add(Number(m[1]));
      }
      for (let unit = 1; unit <= EXPECTED_UNITS; unit++) {
        if (EXEMPT.has(`${book} U${unit}`)) continue;
        expect(covered.has(unit), `${book} U${unit} has no topic`).toBe(true);
      }
    }
  });

  it('cites a unit no higher than the books actually contain', () => {
    // Each of the three books has exactly 15 units. A U16 would be a fabricated
    // citation that the shape check above would happily accept.
    for (const t of TOPICS) {
      const m = t.bookRef?.match(/^(?:Foundations|Breakthrough|Mastery) U(\d+)/);
      if (!m) continue;
      const unit = Number(m[1]);
      expect(unit, `${t.id} cites ${t.bookRef}`).toBeGreaterThanOrEqual(1);
      expect(unit, `${t.id} cites ${t.bookRef}`).toBeLessThanOrEqual(15);
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
    // Vocabulary examples are Spanish shown to the user, so they are held to
    // the same register rule as everything else.
    ...VOCAB.flatMap((v) => [
      { where: `vocab[${v.term}].term`, text: v.term },
      { where: `vocab[${v.term}].example`, text: v.example },
    ]),
    // Authored drills never reached the §5 register verifier, so this suite is
    // the only thing standing between them and the user.
    ...DRILLS.flatMap((d, i) => {
      const where = `drill[${i}] ${d.topicId}`;
      return [
        { where: `${where}.sentence`, text: d.payload.sentence },
        { where: `${where}.answer`, text: d.payload.answer },
        { where: `${where}.explanation`, text: d.payload.explanation },
        { where: `${where}.context`, text: d.payload.context ?? '' },
        ...(d.payload.accept ?? []).map((a) => ({ where: `${where}.accept`, text: a })),
        ...(d.payload.distractors ?? []).flatMap((x) => [
          { where: `${where}.distractor`, text: x.answer },
          { where: `${where}.distractor.feedback`, text: x.feedback },
        ]),
      ];
    }),
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

describe('vocabulary', () => {
  const CATEGORIES = ['connector', 'work_noun', 'verb_pattern', 'collocation', 'set_phrase', 'false_friend'];

  it('has enough words for the SRS to have something to schedule', () => {
    expect(VOCAB.length).toBeGreaterThanOrEqual(60);
  });

  it('has no duplicate terms — `term` is the unique key in SQLite', () => {
    const terms = VOCAB.map((v) => v.term.toLowerCase());
    expect(new Set(terms).size).toBe(terms.length);
  });

  it('uses only the categories §2 declares', () => {
    for (const v of VOCAB) expect(CATEGORIES, v.term).toContain(v.category);
  });

  it('uses only real CEFR levels', () => {
    for (const v of VOCAB) expect(levelIds.has(v.level), v.term).toBe(true);
  });

  it('gives every word a gloss and an example sentence', () => {
    for (const v of VOCAB) {
      expect(v.gloss.length, v.term).toBeGreaterThan(2);
      expect(v.example.length, v.term).toBeGreaterThan(25);
    }
  });

  it('uses the word in its own example — an example that omits it teaches nothing', () => {
    // Matched on the most distinctive token rather than the whole phrase,
    // because a verb is glossed as an infinitive and used conjugated
    // («subsanar» → «subsanamos») and a phrase inflects inside itself
    // («ceñirse al presupuesto» → «nos ceñimos al…»). Where that token is
    // itself a verb, an irregular stem («poner» → «pusimos») means only the
    // opening letters can be relied on.
    const strip = (x: string) => x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const GRAMMAR = new Set(['el', 'la', 'los', 'las', 'un', 'una', 'en', 'a', 'al', 'de', 'del', 'que', 'por', 'se', 'su']);

    for (const v of VOCAB) {
      const tokens = strip(v.term).split(/\s+/).filter((w) => !GRAMMAR.has(w));
      const head = tokens.sort((a, b) => b.length - a.length)[0];
      const needle = /(arse|erse|irse|ar|er|ir)$/.test(head)
        ? head.replace(/(arse|erse|irse|ar|er|ir)$/, '').slice(0, 5)
        : head;
      expect(strip(v.example).includes(needle), `${v.term} → ${v.example}`).toBe(true);
    }
  });

  it('sits every example in a work context', () => {
    const domain =
      /obra|plano|cliente|proveedor|contratista|presupuesto|cronograma|informe|reuni[óo]n|expediente|valoriz|supervis|ingenier|concreto|cimentaci|encofrado|vaciado|licitaci|adenda|contrato|partida|alcance|metrado|cuadrilla|equipo|entrega|material|seguridad|acta|consulta|costo|plazo|capataz|proyecto|estructura|tuber|instalaci|acabado|avance|obra|montaje|procura|grúa|fachada|losa|suelos|municipalidad|consorcio|residente|postor|comit[ée]|frente|ducto|acero|ensayo|prueba|inspecci|coordinaci|facturar|especificaci|riesgo|contingencia|sobrecosto|penalidad|observaci|firma|carpeta|agenda|decisi[óo]n|sistema|nivel|campo|fianza|garant[íi]a|hito|holgura|entregable|subsanaci|salvedad|sustento|respaldo|replanteo|aprobaci[óo]n|adicional|retraso|demora|adelanto|viga|carga|interferencia|sesi[óo]n|consenso/i;
    for (const v of VOCAB) {
      expect(domain.test(v.example), `${v.term}: ${v.example}`).toBe(true);
    }
  });

  it('covers the connector band the B2 exam listens for', () => {
    const connectors = VOCAB.filter((v) => v.category === 'connector');
    expect(connectors.length).toBeGreaterThanOrEqual(10);
  });

  it('covers the false friends that cost money', () => {
    const ff = VOCAB.filter((v) => v.category === 'false_friend').map((v) => v.term);
    for (const must of ['actualmente', 'eventualmente', 'realizar', 'asistir a']) {
      expect(ff).toContain(must);
    }
  });
});

describe('seeding vocabulary into SQLite', () => {
  it('writes every word as a new card', () => {
    const db = freshDb();
    const r = seed(db);
    expect(r.vocab).toBe(VOCAB.length);
    const row = db.prepare("SELECT count(*) AS n FROM vocab WHERE stage = 'new'").get() as { n: number };
    expect(row.n).toBe(VOCAB.length);
  });

  it('never resets a learner’s schedule on re-seed', () => {
    // The whole reason the schedule columns are excluded from the upsert: a
    // seed change must not wipe the ease and due date a month of reviews built.
    const db = freshDb();
    seed(db);
    db.prepare(
      "UPDATE vocab SET stage = 'using', ease = 2.9, interval_days = 21, due_at = '2026-09-01T00:00:00.000Z', reps = 4 WHERE term = ?",
    ).run('sin embargo');

    seed(db);

    const v = db.prepare('SELECT stage, ease, interval_days, reps FROM vocab WHERE term = ?').get('sin embargo') as {
      stage: string; ease: number; interval_days: number; reps: number;
    };
    expect(v).toEqual({ stage: 'using', ease: 2.9, interval_days: 21, reps: 4 });
  });
});
